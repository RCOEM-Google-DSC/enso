/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import { Upload, Loader2, CloudUpload, X, Trash2 } from 'lucide-react'
import Pdfimage from '../assets/pdf.png'
interface Template {
  name: string
  fileName: string
  uploadDate: string
}

export default function TemplatesCertificate() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateName, setTemplateName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null)
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke('get-templates')
      setTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      alert('Please select a PDF file only')
      e.target.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !templateName.trim()) {
      alert('Please provide both template name and PDF file')
      return
    }

    setIsUploading(true)
    try {
      const buffer = await selectedFile.arrayBuffer()
      const result = await window.electron.ipcRenderer.invoke('upload-template', {
        name: templateName.trim(),
        fileBuffer: Array.from(new Uint8Array(buffer))
      })

      if (result.success) {
        console.log('✅ PDF saved successfully at:', result.filePath)
        alert(`Template uploaded successfully!\n\nSaved at: ${result.filePath}`)
        setTemplateName('')
        setSelectedFile(null)
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }
        const fileInput = document.getElementById('pdf-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        await loadTemplates()
      } else {
        alert('Failed to upload template: ' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload template')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePreview = async () => {
    if (selectedFile) {
      try {
        const buffer = await selectedFile.arrayBuffer()
        await window.electron.ipcRenderer.invoke('preview-pdf', {
          fileName: selectedFile.name,
          fileBuffer: Array.from(new Uint8Array(buffer))
        })
      } catch (error) {
        console.error('Failed to preview PDF:', error)
        alert('Failed to preview PDF')
      }
    }
  }

  const closePreview = () => {
    setShowPreview(false)
  }

  const handleViewTemplate = async (fileName: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('get-template-path', fileName)
      if (result.success) {
        const url = `file://${result.filePath}`
        window.electron.ipcRenderer.send('open-pdf', result.filePath)
      }
    } catch (error) {
      console.error('Failed to open template:', error)
    }
  }

  const handleDeleteTemplate = async (fileName: string, templateName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the template "${templateName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeletingTemplate(fileName)
    try {
      const result = await window.electron.ipcRenderer.invoke('delete-template', fileName)
      if (result.success) {
        alert(`Template "${templateName}" deleted successfully!`)
        await loadTemplates()
      } else {
        alert('Failed to delete template: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    } finally {
      setDeletingTemplate(null)
    }
  }

  return (
    <div className="min-h-screen  p-8 text-gray-900">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3  pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-gray-200 text-gray-500 ">
            <CloudUpload className="h-5 w-5" />
          </div>
          <h1 className="text-2xl  tracking-tight text-gray-900">Certificate Templates</h1>
        </div>

        {/* Upload Section */}
        <div className="rounded-xl border border-gray-200 bg-white ">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg  text-gray-900">Upload New Template</h2>
            <p className="text-md text-gray-500">
              Add a new certificate template to your local library.
            </p>
          </div>

          <div className="space-y-6 p-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label
                htmlFor="template-name"
                className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Template Name
              </label>
              <input
                id="template-name"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. bkp , webwiz"
                className="flex mt-2 md-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-md placeholder:text-gray-400  disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              />
            </div>

            {/* Dropzone / File Input */}
            <div className="space-y-2">
              <label className="text-md font-medium leading-none mb-2 mt-2">Upload PDF</label>

              {!selectedFile ? (
                <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-10 text-center hover:bg-gray-100 transition-colors">
                  <div className="mb-4 rounded-full bg-gray-50 hover:bg-gray-100 p-3 text-gray-600">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h3 className="text-md font-medium text-gray-900">
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer text-black-500 hover:underline"
                    >
                      Click to upload
                    </label>
                    <span className="text-gray-500"> or drag and drop</span>
                  </h3>

                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              ) : (
                /* Selected File Card */
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                      <img src={Pdfimage} alt="PDF" className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                      <p className="text-md font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className=" text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <button
                      onClick={handlePreview}
                      className="inline-flex items-center justify-center rounded-md text-md font-medium text-gray-500 ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </button> */}
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        const fileInput = document.getElementById('pdf-upload') as HTMLInputElement
                        if (fileInput) fileInput.value = ''
                      }}
                      className="rounded-full p-2 text-red-400 hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !templateName.trim()}
              className={`flex h-11 w-full items-center justify-center rounded-md  text-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 ${
                isUploading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save Template'
              )}
            </button>
          </div>
        </div>

        {/* Existing Templates List */}
        <div>
          <h2 className="mb-4 text-lg  text-gray-900">Existing Templates</h2>
          {templates.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500">
              <img
                src={Pdfimage}
                alt="No Templates"
                className="mb-2 h-10 w-10 object-contain opacity-50"
              />
              <p>No templates uploaded yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-1">
              {templates.map((template, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:drop-shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full">
                      <img src={Pdfimage} alt="PDF" className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <div className="flex items-center gap-2 text-md text-gray-500">
                        <span>{template.fileName}</span>
                        <span>•</span>
                        <span>{new Date(template.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewTemplate(template.fileName)}
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 hover:text-black "
                    >
                      View PDF
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.fileName, template.name)}
                      disabled={deletingTemplate === template.fileName}
                      className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingTemplate === template.fileName ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
