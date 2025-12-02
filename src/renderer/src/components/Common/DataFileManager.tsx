/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { Trash2, FileDown, FileUp, X, RefreshCcw, Save } from 'lucide-react'
import DataTable from '@renderer/components/Common/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { handleLoad as loadData, handleSave as saveData } from '@renderer/lib/dataManager'
import DataRowForm, { Row as FormRow } from '@renderer/components/Common/AddData'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@renderer/components/ui/alert-dialog'
type Pdf = { name: string }
type Row = {
  id: string
  name: string
  email: string
  pdfs: Pdf[]
}

interface DataFileManagerProps {
  availableFiles: string[]
  defaultFile?: string
}

export default function DataFileManager({ availableFiles, defaultFile }: DataFileManagerProps) {
  const [selectedFile, setSelectedFile] = useState<string>(defaultFile || availableFiles[0] || '')
  const [rows, setRows] = useState<Row[]>([])
  const [originalRows, setOriginalRows] = useState<Row[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // --- IMPORT DIALOG STATE ---
  const [importOpen, setImportOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [importRaw, setImportRaw] = useState<string | null>(null)

  // clear all confirmation
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false)

  // Load data when file selection changes
  useEffect(() => {
    if (selectedFile) {
      loadFileData(selectedFile)
    }
  }, [selectedFile])

  // Check if there are unsaved changes
  useEffect(() => {
    const changed = JSON.stringify(rows) !== JSON.stringify(originalRows)
    setHasChanges(changed)
  }, [rows, originalRows])

  async function loadFileData(filename: string) {
    const res = await loadData(filename)

    if (res.ok && Array.isArray(res.data)) {
      const normalized: Row[] = res.data.map((row: any) => ({
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        email: String(row.email ?? ''),
        pdfs: Array.isArray(row.pdfs) ? row.pdfs.map((p: any) => ({ name: String(p) })) : []
      }))
      setRows(normalized)
      setOriginalRows(normalized)
      setHasChanges(false)
    } else {
      setRows([])
      setOriginalRows([])
      setHasChanges(false)
    }
  }

  function handleRemoveRow(id: string) {
    // Remove in memory only, doesn't persist until save
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function handleAddRow(newRow: FormRow) {
    // Add to beginning of array, in memory only
    setRows((prev) => [newRow, ...prev])
  }

  async function handleSaveChanges() {
    if (!selectedFile) return

    const exportData = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      pdfs: row.pdfs.map((p) => p.name)
    }))

    const res = await saveData(selectedFile, exportData)

    if (res.ok) {
      setOriginalRows(rows)
      setHasChanges(false)
      console.log('Changes saved successfully to:', res.path)
    } else {
      console.error('Failed to save changes:', res.error)
    }
  }

  function handleDiscardChanges() {
    setRows(originalRows)
    setHasChanges(false)
  }

  function handleExport() {
    const exportData = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      pdfs: row.pdfs.map((p) => p.name)
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = selectedFile || 'data.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleClearAll() {
    setRows([])
  }

  async function handleRefresh() {
    if (selectedFile) {
      await loadFileData(selectedFile)
    }
  }

  const sampleImportExample = [
    {
      id: '1',
      name: 'User 1',
      email: 'user1@example.com',
      pdfs: ['file1.pdf', 'file2.pdf']
    },
    {
      id: '2',
      name: 'User 2',
      email: 'user2@example.com',
      pdfs: []
    }
  ]

  function validateAndNormalizeImported(
    value: unknown
  ): { ok: true; rows: Row[] } | { ok: false; error: string } {
    if (!Array.isArray(value))
      return { ok: false, error: 'File must contain a top-level JSON array.' }
    const rowsResult: Row[] = []
    for (let i = 0; i < value.length; i++) {
      const item: any = value[i]
      if (!item || typeof item !== 'object')
        return { ok: false, error: `Item at index ${i} is not an object.` }
      const name = typeof item.name === 'string' ? item.name.trim() : ''
      const email = typeof item.email === 'string' ? item.email.trim() : ''
      if (!name)
        return {
          ok: false,
          error: `Item at index ${i} is missing a valid "name" string.`
        }
      if (!email)
        return {
          ok: false,
          error: `Item at index ${i} is missing a valid "email" string.`
        }

      const rawPdfs = Array.isArray(item.pdfs) ? item.pdfs : []
      const pdfs: Pdf[] = rawPdfs
        .map((p: any) => {
          if (typeof p === 'string') return { name: p }
          if (p && typeof p === 'object' && typeof p.name === 'string') return { name: p.name }
          return null
        })
        .filter(Boolean) as Pdf[]

      const id = item.id !== undefined && item.id !== null ? String(item.id) : ''

      rowsResult.push({
        id,
        name,
        email,
        pdfs
      })
    }

    // ensure unique ids
    const usedIds = new Set<string>()
    let nextNumericId = 1

    for (const r of rowsResult) {
      if (!r.id || usedIds.has(r.id)) {
        while (usedIds.has(String(nextNumericId))) {
          nextNumericId++
        }
        r.id = String(nextNumericId)
        usedIds.add(r.id)
        nextNumericId++
      } else {
        usedIds.add(r.id)
      }
    }

    return { ok: true, rows: rowsResult }
  }

  function handleFileChosen(file: File | null) {
    setImportError(null)
    setImportFileName(null)
    setImportRaw(null)
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.json')) {
      setImportError('Only .json files are allowed.')
      return
    }
    setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setImportRaw(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.onerror = () => setImportError('Failed to read file.')
    reader.readAsText(file)
  }

  function handlePerformImport() {
    setImportError(null)
    if (!importRaw) {
      setImportError('No file selected.')
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(importRaw)
    } catch (err) {
      setImportError('Invalid JSON: ' + (err instanceof Error ? err.message : String(err)))
      return
    }
    const res = validateAndNormalizeImported(parsed)
    if (!res.ok) {
      setImportError(res.error)
      return
    }
    setRows(res.rows)
    setImportOpen(false)
    setImportError(null)
    setImportFileName(null)
    setImportRaw(null)
  }

  const tableColumns: ColumnDef<Row, any>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'NAME' },
    { accessorKey: 'email', header: 'EMAIL' },
    {
      accessorKey: 'pdfs',
      header: 'PDFs',
      cell: ({ getValue }) => {
        const pdfs = (getValue() as Pdf[]) || []
        return pdfs.length ? (
          <div className="flex flex-col gap-1">
            {pdfs.map((p, i) => (
              <div
                key={i}
                className="inline-block rounded border border-gray-200 bg-gray-50 px-2 py-1 font-medium text-gray-700"
              >
                {p.name}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      }
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <button
          className="rounded-md border border-red-500 bg-red-50 px-2 py-1 text-sm text-red-600 hover:bg-red-100"
          onClick={() => handleRemoveRow(row.original.id)}
          type="button"
        >
          Remove
        </button>
      )
    }
  ]

  return (
    <div className="mt-5">
      <div className="mx-auto max-w-7xl space-y-4 p-3 sm:p-4 md:p-6">
        {/* File selector and action buttons */}
        <div className="flex flex-col gap-3">
          {/* File selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Data File:</label>
            <Select value={selectedFile} onValueChange={setSelectedFile}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a data file" />
              </SelectTrigger>
              <SelectContent>
                {availableFiles.map((file) => (
                  <SelectItem key={file} value={file}>
                    {file}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasChanges && (
              <span className="text-sm text-orange-600 font-medium">● Unsaved changes</span>
            )}
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-800 px-3 py-2 text-sm text-gray-100 hover:bg-black sm:flex-initial"
                onClick={handleExport}
                type="button"
              >
                <FileDown className="h-4 w-4" />
                <span>Export</span>
              </button>

              <button
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-800 px-3 py-2 text-sm text-gray-100 hover:bg-black sm:flex-initial"
                onClick={() => {
                  setImportError(null)
                  setImportFileName(null)
                  setImportRaw(null)
                  setImportOpen(true)
                }}
                type="button"
              >
                <FileUp className="h-4 w-4" />
                <span>Import</span>
              </button>

              <Button className="cursor-pointer" onClick={handleRefresh}>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="cursor-pointer hover:bg-red-600"
                    onClick={() => setClearAllConfirmOpen(true)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Clear All</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove all rows? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleClearAll()
                      }}
                      className="bg-red-500 hover:bg-red-600 cursor-pointer"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {hasChanges && (
                <Button variant="outline" className="cursor-pointer" onClick={handleDiscardChanges}>
                  Discard Changes
                </Button>
              )}
              <Button
                className="cursor-pointer bg-green-600 hover:bg-green-700"
                onClick={handleSaveChanges}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Add Row Form */}
        <div className="flex flex-col gap-3">
          <DataRowForm existingRows={rows} onAddRow={handleAddRow} />
        </div>

        {/* DataTable */}
        <div className="flex flex-col gap-3">
          {rows.length > 0 ? (
            <DataTable columns={tableColumns} data={rows} />
          ) : (
            <div className="overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No rows to display. Import some data to get started.
              </div>
            </div>
          )}

          {/* Footer with clear all */}
        </div>
      </div>

      {/* Import Dialog */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setImportOpen(false)} />
          <div className="relative z-50 w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Import JSON</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setImportOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              Upload a .json file containing an array of objects. Each object must include:
            </p>
            <ul className="mt-2 ml-5 list-disc text-sm text-gray-600">
              <li>
                <strong>id</strong> (string)
              </li>
              <li>
                <strong>name</strong> (string)
              </li>
              <li>
                <strong>email</strong> (string)
              </li>
              <li>
                <strong>pdfs</strong> (optional array of strings, e.g.{' '}
                {`["file1.pdf", "file2.pdf"]`})
              </li>
            </ul>

            <div className="mt-4">
              <div className="text-sm text-gray-500">Sample format</div>
              <pre className="font-product mt-2 max-h-40 overflow-auto rounded-md border border-gray-100 bg-gray-50 p-3 text-xs">
                {JSON.stringify(sampleImportExample, null, 2)}
              </pre>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label htmlFor="file" className="flex items-center gap-2">
                <input
                  id="file"
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null)}
                  className="block text-sm"
                  aria-label="Upload JSON file"
                />
              </label>

              <div className="text-sm text-gray-600">
                {importFileName ? (
                  <span>Selected: {importFileName}</span>
                ) : (
                  <span>No file selected</span>
                )}
              </div>
            </div>

            {importError && <div className="mt-3 text-sm text-red-600">{importError}</div>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => {
                  setImportOpen(false)
                  setImportError(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md border border-blue-600 bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handlePerformImport}
                disabled={!importRaw}
              >
                Import JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
