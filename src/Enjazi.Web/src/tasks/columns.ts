// The task table's fixed column widths, shared by TaskRow and
// TaskListSkeleton so the skeleton's cells line up with the rows'. The title
// column has no width and takes the rest.
export const columnWidths = { check: 40, priority: 110, due: 200, actions: 90 }

// The fixed columns and the title, for a cell that spans the whole row.
export const columnCount = Object.keys(columnWidths).length + 1
