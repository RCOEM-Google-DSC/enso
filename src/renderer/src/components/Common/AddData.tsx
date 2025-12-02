import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

type Pdf = { name: string }
export type Row = {
    id: string
    name: string
    email: string
    pdfs: Pdf[]
}

interface DataRowFormProps {
    existingRows: Row[]
    onAddRow: (row: Row) => void
}

export default function DataRowForm({ existingRows, onAddRow }: DataRowFormProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [pdfsInput, setPdfsInput] = useState('')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const trimmedName = name.trim()
        const trimmedEmail = email.trim()
        if (!trimmedName || !trimmedEmail) return

        // Generate next ID based on existing rows
        const existingIds = existingRows
            .map((r) => (typeof r.id === 'string' ? parseInt(r.id, 10) : r.id))
            .filter((id) => !isNaN(id))
        const nextId = existingIds.length ? Math.max(...existingIds) + 1 : 1

        // Parse PDFs from comma-separated input
        const pdfs: Pdf[] = pdfsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((p) => ({ name: p }))

        const newRow: Row = {
            id: String(nextId),
            name: trimmedName,
            email: trimmedEmail,
            pdfs
        }

        onAddRow(newRow)

        // Reset form
        setName('')
        setEmail('')
        setPdfsInput('')
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
            <input
                type="text"
                name="name"
                autoComplete="name"
                aria-label="Name"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-gray-200 focus:outline-none sm:w-48"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <input
                type="email"
                name="email"
                autoComplete="email"
                aria-label="Email"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-gray-200 focus:outline-none sm:w-56"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <Input
                type="file"
                multiple
                name='pdfs'
                aria-label="PDFs"
                className='rounded-md border-gray-200 text-sm shadow-sm focus:ring-2 focus:ring-gray-200 focus:outline-none sm:w-56 cursor-pointer'
                value={pdfsInput}
                onChange={(e) => setPdfsInput(e.target.value)}
            />


            <div className="flex w-full sm:w-auto">
                <Button type="submit" className="w-full rounded-md border border-blue-600 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed  cursor-pointer! disabled:opacity-50 sm:w-auto" disabled={!name.trim() || !email.trim()}>
                    Add
                </Button>
            </div>
        </form>
    )
}
