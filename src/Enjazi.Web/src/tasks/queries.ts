import { notifications } from '@mantine/notifications'
import { useMutation, useMutationState, useQueryClient, type Mutation, type QueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api, fetchClient } from '../api/client'
import { describeError } from '../api/errors'
import { useInvalidate } from '../api/invalidate'
import type { components } from '../api/schema'

export type Task = components['schemas']['TaskResponse']
export type TaskPriority = components['schemas']['TaskPriority']
export type CreateTaskRequest = components['schemas']['CreateTaskRequest']
export type UpdateTaskRequest = components['schemas']['UpdateTaskRequest']
export type TaskChanges = Partial<UpdateTaskRequest>

export const priorities: TaskPriority[] = ['Low', 'Medium', 'High']

// Read from the client rather than written out: a query without parameters
// has a two-element key, which is easy to get wrong by hand.
const listKey = api.queryOptions('get', '/api/tasks').queryKey

// Updates and deletes change the screen before the server answers (ADR-0012).
// The cached list only ever holds what the server said; every write still in
// flight is drawn on top of it when the list is read, in the order the writes
// were made. A write that fails stops being drawn, so there is nothing to roll
// back. The writes share one scope, so their requests reach the server one at
// a time, in order, and each success writes the server's answer into the cache
// before the next request is built from it.
const scope = { id: 'task-writes' }

type UpdateVariables = { id: string; changes: TaskChanges }
type DeleteVariables = { id: string }

export function useTasks() {
  const query = api.useQuery('get', '/api/tasks')
  const writes = useMutationState({ filters: { status: 'pending', predicate: inScope }, select: toWrite })
  const data = useMemo(() => query.data && writes.reduce(applyWrite, query.data), [query.data, writes])
  return { ...query, data }
}

// Create waits for the server: the row needs the id it assigns.
export function useCreateTask() {
  const invalidate = useInvalidate('/api/tasks')
  return api.useMutation('post', '/api/tasks', { onSuccess: invalidate })
}

// TanStack's own useMutation rather than api.useMutation: that fixes the PUT
// body when mutate is called, and it has to be built when the request's turn
// comes. PUT replaces every field, so the body is the server's copy of the
// task with only this update's fields changed.
export function useUpdateTask() {
  const queryClient = useQueryClient()
  const invalidateStreak = useInvalidate('/api/streak')
  return useMutation({
    scope,
    mutationFn: async ({ id, changes }: UpdateVariables) => {
      const saved = findTask(queryClient, id)
      if (!saved) throw new Error('This task no longer exists.')
      const { data, error } = await fetchClient.PUT('/api/tasks/{id}', {
        params: { path: { id } },
        body: { ...toUpdateRequest(saved), ...changes },
      })
      if (error) throw error
      return data
    },
    onSuccess: (saved) => writeList(queryClient, (list) => list.map((task) => (task.id === saved.id ? saved : task))),
    onError: notifyFailure,
    // Completing a task moves the streak, which is never predicted.
    onSettled: () => {
      void invalidateStreak()
      refetchAfterLastWrite(queryClient)
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    scope,
    mutationFn: async ({ id }: DeleteVariables) => {
      const { error } = await fetchClient.DELETE('/api/tasks/{id}', { params: { path: { id } } })
      if (error) throw error
    },
    onSuccess: (_data, { id }) => writeList(queryClient, (list) => list.filter((task) => task.id !== id)),
    onError: notifyFailure,
    onSettled: () => refetchAfterLastWrite(queryClient),
  })
}

function toUpdateRequest(task: Task): UpdateTaskRequest {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueAt: task.dueAt,
    completed: task.completedAt !== null,
  }
}

function findTask(queryClient: QueryClient, id: string) {
  return queryClient.getQueryData<Task[]>(listKey)?.find((task) => task.id === id)
}

// A list fetch still in flight may have been answered before this write
// reached the server, so it is dropped rather than allowed to land on top.
async function writeList(queryClient: QueryClient, change: (list: Task[]) => Task[]) {
  await queryClient.cancelQueries({ queryKey: listKey })
  queryClient.setQueryData<Task[]>(listKey, (list) => list && change(list))
}

// The last write to settle reads the list again, for anything that changed on
// the server meanwhile. Not awaited: the scope's next request waits for
// onSettled, and it need not wait for this. The settling write still counts.
function refetchAfterLastWrite(queryClient: QueryClient) {
  if (queryClient.isMutating({ predicate: inScope }) === 1) {
    void queryClient.invalidateQueries({ queryKey: listKey })
  }
}

// A pending write as the list draws it; `at` is when it was made.
type Write = { id: string; changes?: TaskChanges; at: number }

function inScope(mutation: Mutation<unknown, Error, unknown, unknown>) {
  return mutation.options.scope?.id === scope.id
}

// Only this file's two mutations are in the scope. A delete has no changes.
function toWrite(mutation: Mutation<unknown, Error, unknown, unknown>): Write {
  const variables = mutation.state.variables as UpdateVariables | DeleteVariables
  return { ...variables, at: mutation.state.submittedAt }
}

function applyWrite(list: Task[], write: Write): Task[] {
  const { id, changes, at } = write
  if (!changes) return list.filter((task) => task.id !== id)
  return list.map((task) => (task.id === id ? applyChanges(task, changes, at) : task))
}

// A task already completed keeps its original time when saved again.
function applyChanges(task: Task, { completed, ...fields }: TaskChanges, at: number): Task {
  let completedAt = task.completedAt
  if (completed === false) completedAt = null
  if (completed && completedAt === null) completedAt = new Date(at).toISOString()
  return { ...task, ...fields, completedAt }
}

function notifyFailure(error: unknown) {
  notifications.show({ color: 'red', message: describeError(error) })
}
