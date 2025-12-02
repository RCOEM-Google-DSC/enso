
## Data Table

- **Location:** `src/renderer/src/components/Common/DataTable.tsx`
- **Purpose:** A generic, client-side data table wrapper around `@tanstack/react-table` that provides searching, sorting, pagination and simple UI controls.

- **Props:**
  - `columns: ColumnDef<TData, TValue>[]` — Column definitions supplied to `@tanstack/react-table`.
  - `data: TData[]` — Array of row objects to display.

- **Usage:**
  - Import and render the component with your typed columns and data.

```tsx
import DataTable from '@renderer/components/Common/DataTable'
import { ColumnDef } from '@tanstack/react-table'

type Row = { id: string; name: string; email: string; pdfs: { name: string }[] }

const columns: ColumnDef<Row, any>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'pdfs',
    header: 'PDFs',
    cell: ({ getValue }) => /* custom renderer */ null
  }
]

function MyPage() {
  const data: Row[] = /* load/hold your rows */ []
  return <DataTable columns={columns} data={data} />
}
```

- **Notes & tips:**
  - `DataTable` is UI-only: it expects the parent to provide the `data` array and update it when rows change (add/remove/import/export).
  - Use `ColumnDef`'s `cell` renderer to customize how complex fields (like `pdfs`) are rendered.
  - The table already includes a page-size selector, search input and pagination controls.

## DataFileManager

- **Location:** `src/renderer/src/components/Common/DataFileManager.tsx`
- **Purpose:** A reusable manager UI that lets the user choose a data file (e.g. `test-data.json`, `data.json`, `copy.json`), view/edit rows in memory, import/export, and persist changes to the selected file. It coordinates file-level operations with the main process via the preload/API layer (see the `data:*` IPC handlers above).

- **Props:**
  - `availableFiles: string[]` — List of filenames the manager can operate on (relative to the renderer `data` folder in dev or `app.getPath('userData')` in prod).
  - `defaultFile?: string` — Optional filename to select initially. Falls back to the first entry of `availableFiles`.

- **Behavior / Workflow:**
  - When the user selects a file, `DataFileManager` loads its contents via the `data:load` IPC handler (exposed by the preload bridge as `window.api.loadData` or via `@renderer/lib/dataManager`).
  - Edits (add, remove, import, clear) are performed in-memory. The UI shows an "Unsaved changes" indicator when the in-memory rows differ from what was loaded.
  - Clicking "Save Changes" writes the entire array back to the selected file via `data:save`. The file-level write is handled in the main process (see `ipc.md` `data:save` handler above).
  - Export/Import perform client-side JSON download/upload. Imported data is validated and normalized before replacing the in-memory rows.

- **How to use in your app:**
  - Basic integration — add the manager to a page and provide the list of known files:

```tsx
import DataFileManager from '@renderer/components/Common/DataFileManager'

export default function AdminDataPage() {
  return (
    <DataFileManager
      availableFiles={['test-data.json', 'data.json', 'copy.json']}
      defaultFile="test-data.json"
    />
  )
}
```

- **Programmatic usage notes:**
  - If you need to perform low-level file operations from other code, use the IPC handlers documented above (`data:load`, `data:save`, `data:add`, `data:remove`, `data:removeAll`). The project also includes a small helper at `src/renderer/src/lib/dataManager.ts` that wraps `window.api` calls with friendly function names (`handleLoad`, `handleSave`, etc.).

  - Example: load data and save it from a non-UI helper

```ts
import { handleLoad, handleSave } from '@renderer/lib/dataManager'

async function dedupeAndSave(filename: string) {
  const res = await handleLoad(filename)
  if (!res.ok || !Array.isArray(res.data)) return
  const rows = res.data as any[]
  // perform dedupe/transform
  const unique = /* ... */ rows
  await handleSave(filename, unique)
}
```

- **Integration with `DataRowForm` (Add row):**
  - `DataFileManager` includes an add-row form (see `DataRowForm.tsx`) which inserts a row into the in-memory dataset. To persist that new row, click "Save Changes" in the manager.

- **Important file path note:**
  - In development the data files are resolved from `src/renderer/src/data/*`. In production they are resolved from the Electron `app.getPath('userData')` folder. The main process helper `getDataFilePath(filename)` handles this resolution (see IPC handlers above).




