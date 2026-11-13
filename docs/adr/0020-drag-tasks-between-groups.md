# ADR-0020: Dragging a task onto another group

**Status:** accepted
**Date:** 2026-11-13

## Context

The Tasks screen divides one table into groups by due date (ADR-0012):
Overdue, Today, This week, Later, No date, Completed. Moving a task from one
group to another meant opening the edit modal and picking a date, or ticking
the box. The request was to drag tasks on this screen.

A task has no saved position. Groups are derived from `dueAt` and
`completedAt`, and inside a group the order is derived too. So "drag and
drop" could mean two features: reorder tasks, which needs a new column, or
move a task to another group, which changes fields the task already has. The
second was chosen. The API, the schema and the OpenAPI document are
unchanged.

The mechanisms, stated before the decisions:

1. **`@dnd-kit/core` separates what starts a drag from what is dragged.**
   `useDraggable` gives a node ref for the element that is measured, an
   activator ref and listeners for the element that starts the drag, and
   ARIA attributes for it. Sensors turn input into drags: `PointerSensor`
   (mouse, touch and pen through pointer events) and `KeyboardSensor`
   (Space or Enter to pick up and to drop, Escape to cancel, and a
   `coordinateGetter` that decides where an arrow key moves the dragged
   rectangle).
2. **`DragOverlay` renders a copy.** The dragged element stays in the
   document untouched; a fixed-position copy follows the input. The overlay
   is placed at the rectangle the library measures for the dragged element
   in the first layout effect after the drag starts, plus the distance
   dragged since.
3. **`useDroppable` registers a drop target** with a node, optional `data`
   and a `disabled` flag. On every render during a drag the context's
   `collisionDetection` function gets the dragged rectangle, the pointer's
   coordinates (null for a keyboard drag) and the measured rectangles of the
   enabled targets, and returns the targets hit; the first is `over`.
   Rectangles are measured ignoring CSS transforms, and again whenever the
   set of targets changes.
4. **The context announces.** It renders a visually hidden
   `role="status"` live region and a hidden instructions element that every
   draggable's `aria-describedby` points to. The texts come from the
   `accessibility` prop.
5. **The rows already belong to `motion`.** Each task row is an `m.tr`
   whose `transform` and `opacity` the library drives for enter, exit and
   `layout` moves (ADR-0012). A change saved through `useUpdateTask` is
   drawn at once and the row slides to its new group.

## Decisions

### A drop changes the fields that put the task in that group

| Dropped on | Changes |
|---|---|
| Today | due today |
| This week | due tomorrow, the first day of that group |
| Later | due on the eighth day from today, the first day of that group |
| No date | due date cleared |
| Completed | ticked; the due date stays |

A task that had a due date keeps its time of day. A task that had none is
due at 23:59. A completed task dropped on any group but Completed is open
again. Overdue takes no drop, and neither does the task's own group.

The rule is one pure function, `changesFor` in `src/tasks/moving.ts`. Its
result goes to `useUpdateTask` like a tick or a rename, so the move shows
before the request answers, reverts with a notification when the request
fails, queues behind other writes, and moves the streak when it completes a
task. A drop on Completed does not linger: the pause exists so a tick is
seen to land, and a drag is watched all the way.

Keeping the time of day means a task dropped on Today whose time has
already passed gets today's date and is still overdue. That is what its
date then says. It was chosen over always using 23:59, which would discard
a time someone set.

### Drag by a handle, onto any row of a group

Each row starts with a `Move` handle. The row holds a checkbox, a title
that renames on click and two buttons, so a drag that started anywhere on
it would fight them; and a row cannot carry `role="button"` without ceasing
to be a row. The handle is the activator; the row is the node, so the copy
is as wide and as tall as the row.

Every row of a group is a drop target for that group, the header row and
each task row, because the table is flat: all rows share one `tbody` so
that a row can slide from group to group. The group under the drag is
tinted with the accent tint on all its rows.

The dragged row is never transformed. `motion` owns its `transform`, and
two libraries writing one style property do not compose. The row fades in
place and a `DragOverlay` copy follows the input. There is no drop
animation: after a drop the row itself slides to its new group.

### Empty groups show while a task is dragged

A group with no tasks is normally left out, so without this a task could
not be moved to Today on a day with nothing due. During a drag every group
that takes a drop shows its header, with a count of 0.

The rows slide when those headers open, which had three consequences. Each
was a bug before it was a decision:

- **The headers open after the library has placed the copy.** Opened in
  the same render as the drag start, the row had already moved down when
  the library measured it, and the copy appeared that far below the
  pointer. `TaskTable` adds the headers once `dragOverlay.rect` exists.
- **Nothing is a target until the task has been carried.** The pointer has
  not moved when a group slides under it, and the copy of a task picked up
  with a key can find a header opening exactly where it stands. Either way
  that group was not chosen, and letting go would have moved the task
  there. A pointer drag counts once it is half the row's height from where
  it started; a keyboard drag once an arrow key has chosen a group.
- **Arrow keys count groups, not pixels.** Up and Down put the copy on the
  header of the previous or next group that takes the task, counted from
  the header it is on or, before that, from the task's own row. Counting
  from the copy's position was wrong after the rows had slid away from it.

### The library's live region is used, with the app's words

Announcements name the task by its title and the group by its label, and
the instructions describe these keys. The streak chip already has a
`role="status"` region on this screen, so there are now two; the one test
that asked for "the status" on the page now asks for the one that speaks of
points.

## Rejected alternatives

- **A saved order per task.** A `Position` column, a migration, a reorder
  endpoint, and groups sorted by hand instead of by due date. It is a
  different feature, and it gives up the property that the list is derived
  from the tasks' own fields.
- **`@dnd-kit/react`.** The rewrite of the same library, released more
  recently, but 0.x: its API can still change under a minor version.
- **`@atlaskit/pragmatic-drag-and-drop`.** Smaller, on the browser's native
  drag events, which have no keyboard path; the keyboard would need a
  second mechanism.
- **`@hello-pangea/dnd`.** Built for reordering lists and moving items
  between lists. The targets here are groups, not positions.
- **`@dnd-kit/sortable`.** The same: it sorts. Only `@dnd-kit/core` is
  installed.
- **Native HTML drag and drop, no library.** No touch support and no
  keyboard path, and the drag image cannot be styled.
- **Showing empty groups all the time.** No rows would slide during a
  drag, but an account with three tasks would look at five empty headers.
- **A bar of drop targets fixed to the edge of the screen.** No rows would
  slide either, but there would be two kinds of target, and arrow keys
  would need a second axis.

## Consequences

- One dependency, `@dnd-kit/core` 6.3. Its last release was in December
  2024 and the rewrite is where its authors work now. Its peer range is
  React 16.8 and up, and the browser suite passes on React 19.
- The task table has a sixth column, 48px, and the loading skeleton has it
  too.
- `docs/design.md` has the behaviour under "Screens > Tasks > Dragging" and
  the new names under "Test contract".
- `e2e/task-drag.spec.ts` drives real pointer and key input: every group's
  date rule, the targets, Overdue and the own group refused, cancel, a
  failed save, the keyboard path, and reduced motion.
- On a touch screen the handle drags and the rest of the row scrolls the
  page. This was not tested on a device.
