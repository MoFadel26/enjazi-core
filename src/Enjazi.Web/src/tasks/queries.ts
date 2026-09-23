import { api } from '../api/client'
import { useInvalidate } from '../api/invalidate'
import type { components } from '../api/schema'

export type Task = components['schemas']['TaskResponse']
export type TaskPriority = components['schemas']['TaskPriority']
export type CreateTaskRequest = components['schemas']['CreateTaskRequest']
export type UpdateTaskRequest = components['schemas']['UpdateTaskRequest']

export const priorities: TaskPriority[] = ['Low', 'Medium', 'High']

export function useTasks() {
  return api.useQuery('get', '/api/tasks')
}

export function useCreateTask() {
  const invalidate = useInvalidate('/api/tasks')
  return api.useMutation('post', '/api/tasks', { onSuccess: invalidate })
}

export function useUpdateTask() {
  const invalidate = useInvalidate('/api/tasks')
  return api.useMutation('put', '/api/tasks/{id}', { onSuccess: invalidate })
}

export function useDeleteTask() {
  const invalidate = useInvalidate('/api/tasks')
  return api.useMutation('delete', '/api/tasks/{id}', { onSuccess: invalidate })
}

// PUT replaces the whole task, so a one-field change still sends every field.
export function toUpdateRequest(task: Task, changes: Partial<UpdateTaskRequest> = {}): UpdateTaskRequest {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueAt: task.dueAt,
    completed: task.completedAt !== null,
    ...changes,
  }
}
