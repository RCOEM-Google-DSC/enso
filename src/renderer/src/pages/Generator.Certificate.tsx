// import { useState, useEffect } from 'react'
// import {
//   FileText,
//   Settings,
//   User,
//   Save,
//   Eye,
//   Upload,
//   FileSpreadsheet,
//   CheckCircle,
//   Loader2,
//   FolderOpen
// } from 'lucide-react'
// import * as XLSX from 'xlsx'

// interface Template {
//   name: string
//   fileName: string
// }

// interface GeneratedRecord {
//   templateName: string
//   recipientName: string
//   fileName: string
//   date: string
//   status: 'success' | 'failed'
//   path?: string
// }

// export default function CertificateMaker() {
//   const [templates, setTemplates] = useState<Template[]>([])
//   const [selectedTemplate, setSelectedTemplate] = useState<string>('')
//   const [testMode, setTestMode] = useState(true)

//   // Test Mode State
//   const [testName, setTestName] = useState('')

//   // Bulk Mode State
//   const [bulkFile, setBulkFile] = useState<File | null>(null)
//   const [bulkNames, setBulkNames] = useState<string[]>([])

//   // Processing State
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [generatedRecords, setGeneratedRecords] = useState<GeneratedRecord[]>([])

//   // Load templates on mount
//   useEffect(() => {
//     loadTemplates()
//     loadGeneratedHistory()
//   }, [])

//   const loadTemplates = async () => {
//     try {
//       const data = await window.electron.ipcRenderer.invoke('get-templates')
//       setTemplates(data || [])
//     } catch (error) {
//       console.error('Failed to load templates', error)
//     }
//   }

//   const loadGeneratedHistory = async () => {
//     try {
//       const history = await window.electron.ipcRenderer.invoke(
//         'data:load',
//         'generated.certificates.json'
//       )
//       if (history.ok) setGeneratedRecords(history.data)
//     } catch (error) {
//       console.error('Failed to load history', error)
//     }
//   }

//   // File Parsing Logic
//   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     setBulkFile(file)
//     setBulkNames([]) // Reset names

//     const extension = file.name.split('.').pop()?.toLowerCase()
//     const reader = new FileReader()

//     if (extension === 'xlsx' || extension === 'xls') {
//       reader.onload = (event) => {
//         try {
//           const data = event.target?.result
//           const workbook = XLSX.read(data, { type: 'array' })
//           const sheetName = workbook.SheetNames[0]
//           const sheet = workbook.Sheets[sheetName]
//           const json = XLSX.utils.sheet_to_json(sheet) as any[]

//           const names = json
//             .map((row) => row.name || row.Name || Object.values(row)[0])
//             .filter(Boolean)
//           setBulkNames(names as string[])
//         } catch (e) {
//           console.error(e)
//           alert('Failed to parse Excel file.')
//         }
//       }
//       reader.readAsArrayBuffer(file)
//     } else if (extension === 'txt' || extension === 'csv' || extension === 'json') {
//       reader.onload = (event) => {
//         try {
//           const text = event.target?.result as string
//           let names: string[] = []

//           if (extension === 'json') {
//             const json = JSON.parse(text)
//             if (Array.isArray(json)) {
//               names = json.map((item) => item.name || item.Name).filter(Boolean)
//             }
//           } else if (extension === 'txt') {
//             names = text
//               .split('\n')
//               .map((line) => line.trim())
//               .filter((line) => line.length > 0)
//           } else if (extension === 'csv') {
//             const lines = text.split('\n')
//             const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
//             const nameIndex = headers.indexOf('name')

//             names = lines
//               .slice(1)
//               .map((line) => {
//                 const cols = line.split(',')
//                 return nameIndex > -1 ? cols[nameIndex]?.trim() : cols[0]?.trim()
//               })
//               .filter(Boolean)
//           }
//           setBulkNames(names)
//         } catch (err) {
//           alert('Failed to parse file: ' + err)
//         }
//       }
//       reader.readAsText(file)
//     }
//   }

//   // Action: Preview (Test Mode)
//   const handlePreview = async () => {
//     if (!selectedTemplate || !testName) return alert('Please select a template and enter a name')

//     setIsProcessing(true)
//     try {
//       const template = templates.find((t) => t.name === selectedTemplate)
//       if (!template) return

//       await window.electron.ipcRenderer.invoke('generate-preview', {
//         templateFileName: template.fileName,
//         data: { name: testName }
//       })
//     } catch (error) {
//       console.error(error)
//       alert('Failed to generate preview')
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   // Action: Save Single (Test Mode)
//   const handleSaveTest = async () => {
//     if (!selectedTemplate || !testName) return

//     setIsProcessing(true)
//     try {
//       const template = templates.find((t) => t.name === selectedTemplate)
//       if (!template) return

//       const saveResult = await window.electron.ipcRenderer.invoke('generate-save-single', {
//         templateFileName: template.fileName,
//         templateName: template.name,
//         data: { name: testName }
//       })

//       if (saveResult.success) {
//         alert(`Certificate saved at: ${saveResult.path}`)
//         await addToHistory(template.name, testName, saveResult.path)
//       }
//     } catch (error) {
//       console.error(error)
//       alert('Failed to save certificate')
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   // Action: Bulk Generate
//   const handleBulkGenerate = async () => {
//     if (!selectedTemplate || bulkNames.length === 0) return

//     setIsProcessing(true)
//     try {
//       const template = templates.find((t) => t.name === selectedTemplate)
//       if (!template) return

//       const result = await window.electron.ipcRenderer.invoke('generate-bulk', {
//         templateFileName: template.fileName,
//         templateName: template.name,
//         names: bulkNames
//       })

//       if (result.success) {
//         alert(`Successfully generated ${result.count} certificates!\nSaved in: ${result.folder}`)

//         const newRecords = bulkNames.map((name) => ({
//           templateName: template.name,
//           recipientName: name,
//           fileName: `${template.name}_${name.replace(/[^a-z0-9]/gi, '_')}.pdf`,
//           date: new Date().toISOString(),
//           status: 'success' as const,
//           path: `${result.folder}/${template.name}_${name.replace(/[^a-z0-9]/gi, '_')}.pdf`
//         }))

//         const currentHistory = await window.electron.ipcRenderer.invoke(
//           'data:load',
//           'generated.certificates.json'
//         )
//         const updatedHistory = [...(newRecords || []), ...(currentHistory.data || [])]
//         await window.electron.ipcRenderer.invoke(
//           'data:save',
//           'generated.certificates.json',
//           updatedHistory
//         )
//         setGeneratedRecords(updatedHistory)
//       } else {
//         alert('Bulk generation failed or was cancelled.')
//       }
//     } catch (error) {
//       console.error(error)
//       alert('Error during bulk generation')
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const addToHistory = async (templateName: string, recipientName: string, path: string) => {
//     const record: GeneratedRecord = {
//       templateName,
//       recipientName,
//       fileName: path.split(/[/\\]/).pop() || 'unknown.pdf',
//       date: new Date().toISOString(),
//       status: 'success',
//       path
//     }
//     const current = await window.electron.ipcRenderer.invoke(
//       'data:load',
//       'generated.certificates.json'
//     )
//     const newData = [record, ...(current.data || [])]
//     await window.electron.ipcRenderer.invoke('data:save', 'generated.certificates.json', newData)
//     setGeneratedRecords(newData)
//   }

//   return (
//     <div className="min-h-screen bg-gray-50/50 p-8 text-slate-900">
//       <div className="mx-auto max-w-5xl space-y-8">
//         {/* Header */}
//         <div className="flex items-center space-x-3 border-b pb-4">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
//             <FileSpreadsheet className="h-6 w-6" />
//           </div>
//           <h1 className="text-2xl font-bold tracking-tight text-slate-900">Certificate Maker</h1>
//         </div>

//         <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//           {/* Main Controls */}
//           <div className="lg:col-span-2 space-y-6">
//             <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
//               <h2 className="mb-4 text-lg font-semibold text-slate-900">Configuration</h2>

//               {/* Template Selection */}
//               <div className="mb-6 space-y-2">
//                 <label className="text-sm font-medium">Select Template</label>
//                 <select
//                   className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
//                   value={selectedTemplate}
//                   onChange={(e) => setSelectedTemplate(e.target.value)}
//                 >
//                   <option value="">-- Choose a Template --</option>
//                   {templates.map((t) => (
//                     <option key={t.fileName} value={t.name}>
//                       {t.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Mode Toggle */}
//               <div className="mb-6 rounded-lg bg-slate-100 p-1 flex">
//                 <button
//                   onClick={() => setTestMode(true)}
//                   className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
//                     testMode
//                       ? 'bg-white text-blue-600 shadow-sm'
//                       : 'text-slate-500 hover:text-slate-900'
//                   }`}
//                 >
//                   <Settings className="mr-2 h-4 w-4" />
//                   Test Mode
//                 </button>
//                 <button
//                   onClick={() => setTestMode(false)}
//                   className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
//                     !testMode
//                       ? 'bg-white text-blue-600 shadow-sm'
//                       : 'text-slate-500 hover:text-slate-900'
//                   }`}
//                 >
//                   <FileText className="mr-2 h-4 w-4" />
//                   Bulk Generate
//                 </button>
//               </div>

//               {/* Dynamic Content Based on Mode */}
//               <div className="space-y-4">
//                 {testMode ? (
//                   // Test Mode UI
//                   <div className="animate-in fade-in slide-in-from-top-2 duration-300">
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Recipient Name</label>
//                       <div className="relative">
//                         <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
//                         <input
//                           type="text"
//                           value={testName}
//                           onChange={(e) => setTestName(e.target.value)}
//                           placeholder="Enter name for certificate..."
//                           className="pl-9 flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
//                         />
//                       </div>
//                     </div>

//                     <div className="flex gap-3 pt-4">
//                       <button
//                         onClick={handlePreview}
//                         disabled={isProcessing || !testName || !selectedTemplate}
//                         className="flex-1 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus:ring-2 focus:ring-blue-600"
//                       >
//                         {isProcessing ? (
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         ) : (
//                           <Eye className="mr-2 h-4 w-4" />
//                         )}
//                         Preview
//                       </button>
//                       <button
//                         onClick={handleSaveTest}
//                         disabled={isProcessing || !testName || !selectedTemplate}
//                         className="flex-1 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-600"
//                       >
//                         <Save className="mr-2 h-4 w-4" />
//                         Save Certificate
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   // Bulk Mode UI
//                   <div className="animate-in fade-in slide-in-from-top-2 duration-300">
//                     <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
//                       <input
//                         type="file"
//                         id="bulk-upload"
//                         className="hidden"
//                         accept=".txt,.csv,.json,.xlsx,.xls"
//                         onChange={handleFileSelect}
//                       />
//                       <label
//                         htmlFor="bulk-upload"
//                         className="cursor-pointer flex flex-col items-center"
//                       >
//                         <Upload className="h-8 w-8 text-slate-400 mb-3" />
//                         <span className="text-sm font-medium text-slate-900">
//                           {bulkFile ? bulkFile.name : 'Upload Data File'}
//                         </span>
//                         <span className="text-xs text-slate-500 mt-1">
//                           Supports .txt, .csv, .json, .xlsx
//                         </span>
//                       </label>
//                     </div>

//                     {bulkNames.length > 0 && (
//                       <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-center">
//                         <CheckCircle className="h-4 w-4 mr-2" />
//                         Found {bulkNames.length} names to process
//                       </div>
//                     )}

//                     <button
//                       onClick={handleBulkGenerate}
//                       disabled={isProcessing || bulkNames.length === 0 || !selectedTemplate}
//                       className="w-full mt-4 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       {isProcessing ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Generating {bulkNames.length} Files...
//                         </>
//                       ) : (
//                         <>
//                           <FolderOpen className="mr-2 h-4 w-4" />
//                           Generate All Certificates
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* History / Status Side Panel */}
//           <div className="lg:col-span-1">
//             <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full max-h-[600px] flex flex-col">
//               <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Generation</h2>

//               <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
//                 {generatedRecords.length === 0 ? (
//                   <div className="text-center py-10 text-slate-500">
//                     <p className="text-sm">No certificates generated yet.</p>
//                   </div>
//                 ) : (
//                   generatedRecords.map((record, i) => (
//                     <div
//                       key={i}
//                       className="flex items-start p-3 rounded-lg border border-slate-100 bg-slate-50"
//                     >
//                       <div className="mt-1 mr-3">
//                         <CheckCircle className="h-4 w-4 text-green-500" />
//                       </div>
//                       <div className="overflow-hidden">
//                         <p className="text-sm font-medium text-slate-900 truncate">
//                           {record.recipientName}
//                         </p>
//                         <p className="text-xs text-slate-500 truncate">{record.templateName}</p>
//                         <p className="text-[10px] text-slate-400 mt-1">
//                           {new Date(record.date).toLocaleString()}
//                         </p>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

import { useState, useEffect } from 'react'
import {
  FileText,
  Settings,
  User,
  Save,
  Eye,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  FolderOpen,
  Sliders
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface Template {
  name: string
  fileName: string
}

interface GeneratedRecord {
  templateName: string
  recipientName: string
  fileName: string
  date: string
  status: 'success' | 'failed'
  path?: string
}

interface PdfConfig {
  fontSize: number
  yOffset: number
  textColor: {
    r: number
    g: number
    b: number
  }
}

export default function CertificateMaker() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [testMode, setTestMode] = useState(true)

  // Config State
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<PdfConfig>({
    fontSize: 45,
    yOffset: 25,
    textColor: { r: 93, g: 97, b: 103 }
  })

  // Test Mode State
  const [testName, setTestName] = useState('')

  // Bulk Mode State
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkNames, setBulkNames] = useState<string[]>([])

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedRecords, setGeneratedRecords] = useState<GeneratedRecord[]>([])

  // Load templates & config on mount
  useEffect(() => {
    loadTemplates()
    loadGeneratedHistory()
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const saved = await window.electron.ipcRenderer.invoke('data:load', 'pdf_settings.json')
      if (saved.data && Object.keys(saved.data).length > 0) {
        setConfig(saved.data)
      }
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }

  const saveConfig = async (newConfig: PdfConfig) => {
    setConfig(newConfig)
    try {
      await window.electron.ipcRenderer.invoke('data:save', 'pdf_settings.json', newConfig)
    } catch (e) {
      console.error('Failed to save settings', e)
    }
  }

  const loadTemplates = async () => {
    try {
      const data = await window.electron.ipcRenderer.invoke('get-templates')
      setTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates', error)
    }
  }

  const loadGeneratedHistory = async () => {
    try {
      const history = await window.electron.ipcRenderer.invoke(
        'data:load',
        'generated.certificates.json'
      )
      if (history.ok) setGeneratedRecords(history.data)
    } catch (error) {
      console.error('Failed to load history', error)
    }
  }

  // File Parsing Logic
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBulkFile(file)
    setBulkNames([]) // Reset names

    const extension = file.name.split('.').pop()?.toLowerCase()
    const reader = new FileReader()

    if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (event) => {
        try {
          const data = event.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(sheet) as any[]

          const names = json
            .map((row) => row.name || row.Name || Object.values(row)[0])
            .filter(Boolean)
          setBulkNames(names as string[])
        } catch (e) {
          console.error(e)
          alert('Failed to parse Excel file.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else if (extension === 'txt' || extension === 'csv' || extension === 'json') {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          let names: string[] = []

          if (extension === 'json') {
            const json = JSON.parse(text)
            if (Array.isArray(json)) {
              names = json.map((item) => item.name || item.Name).filter(Boolean)
            }
          } else if (extension === 'txt') {
            names = text
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
          } else if (extension === 'csv') {
            const lines = text.split('\n')
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
            const nameIndex = headers.indexOf('name')

            names = lines
              .slice(1)
              .map((line) => {
                const cols = line.split(',')
                return nameIndex > -1 ? cols[nameIndex]?.trim() : cols[0]?.trim()
              })
              .filter(Boolean)
          }
          setBulkNames(names)
        } catch (err) {
          alert('Failed to parse file: ' + err)
        }
      }
      reader.readAsText(file)
    }
  }

  // Action: Preview (Test Mode)
  const handlePreview = async () => {
    if (!selectedTemplate || !testName) return alert('Please select a template and enter a name')

    setIsProcessing(true)
    try {
      const template = templates.find((t) => t.name === selectedTemplate)
      if (!template) return

      await window.electron.ipcRenderer.invoke('generate-preview', {
        templateFileName: template.fileName,
        data: { name: testName },
        options: config
      })
    } catch (error) {
      console.error(error)
      alert('Failed to generate preview')
    } finally {
      setIsProcessing(false)
    }
  }

  // Action: Save Single (Test Mode)
  const handleSaveTest = async () => {
    if (!selectedTemplate || !testName) return

    setIsProcessing(true)
    try {
      const template = templates.find((t) => t.name === selectedTemplate)
      if (!template) return

      const saveResult = await window.electron.ipcRenderer.invoke('generate-save-single', {
        templateFileName: template.fileName,
        templateName: template.name,
        data: { name: testName },
        options: config
      })

      if (saveResult.success) {
        alert(`Certificate saved at: ${saveResult.path}`)
        await addToHistory(template.name, testName, saveResult.path)
      }
    } catch (error) {
      console.error(error)
      alert('Failed to save certificate')
    } finally {
      setIsProcessing(false)
    }
  }

  // Action: Bulk Generate
  const handleBulkGenerate = async () => {
    if (!selectedTemplate || bulkNames.length === 0) return

    setIsProcessing(true)
    try {
      const template = templates.find((t) => t.name === selectedTemplate)
      if (!template) return

      const result = await window.electron.ipcRenderer.invoke('generate-bulk', {
        templateFileName: template.fileName,
        templateName: template.name,
        names: bulkNames,
        options: config
      })

      if (result.success) {
        alert(`Successfully generated ${result.count} certificates!\nSaved in: ${result.folder}`)

        const newRecords = bulkNames.map((name) => ({
          templateName: template.name,
          recipientName: name,
          fileName: `${template.name}_${name.replace(/[^a-z0-9]/gi, '_')}.pdf`,
          date: new Date().toISOString(),
          status: 'success' as const,
          path: `${result.folder}/${template.name}_${name.replace(/[^a-z0-9]/gi, '_')}.pdf`
        }))

        const currentHistory = await window.electron.ipcRenderer.invoke(
          'data:load',
          'generated.certificates.json'
        )
        const updatedHistory = [...(newRecords || []), ...(currentHistory.data || [])]
        await window.electron.ipcRenderer.invoke(
          'data:save',
          'generated.certificates.json',
          updatedHistory
        )
        setGeneratedRecords(updatedHistory)
      } else {
        alert('Bulk generation failed or was cancelled.')
      }
    } catch (error) {
      console.error(error)
      alert('Error during bulk generation')
    } finally {
      setIsProcessing(false)
    }
  }

  const addToHistory = async (templateName: string, recipientName: string, path: string) => {
    const record: GeneratedRecord = {
      templateName,
      recipientName,
      fileName: path.split(/[/\\]/).pop() || 'unknown.pdf',
      date: new Date().toISOString(),
      status: 'success',
      path
    }
    const current = await window.electron.ipcRenderer.invoke(
      'data:load',
      'generated.certificates.json'
    )
    const newData = [record, ...(current.data || [])]
    await window.electron.ipcRenderer.invoke('data:save', 'generated.certificates.json', newData)
    setGeneratedRecords(newData)
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Certificate Maker</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Configuration</h2>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="PDF Settings"
                >
                  <Sliders className="h-5 w-5" />
                </button>
              </div>

              {/* PDF Settings Panel */}
              {showConfig && (
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 animate-in fade-in slide-in-from-top-2">
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    PDF Styling Parameters
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500">Font Size</label>
                      <input
                        type="number"
                        value={config.fontSize}
                        onChange={(e) =>
                          saveConfig({ ...config, fontSize: parseInt(e.target.value) })
                        }
                        className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Vertical Offset (Y)
                      </label>
                      <input
                        type="number"
                        value={config.yOffset}
                        onChange={(e) =>
                          saveConfig({ ...config, yOffset: parseInt(e.target.value) })
                        }
                        className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Text Color (RGB)
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <span className="text-[10px] text-red-500 font-bold block">R</span>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={config.textColor.r}
                            onChange={(e) =>
                              saveConfig({
                                ...config,
                                textColor: { ...config.textColor, r: parseInt(e.target.value) }
                              })
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] text-green-500 font-bold block">G</span>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={config.textColor.g}
                            onChange={(e) =>
                              saveConfig({
                                ...config,
                                textColor: { ...config.textColor, g: parseInt(e.target.value) }
                              })
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] text-blue-500 font-bold block">B</span>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={config.textColor.b}
                            onChange={(e) =>
                              saveConfig({
                                ...config,
                                textColor: { ...config.textColor, b: parseInt(e.target.value) }
                              })
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div
                          className="w-10 h-10 rounded border border-slate-300 mt-auto shadow-sm"
                          style={{
                            backgroundColor: `rgb(${config.textColor.r}, ${config.textColor.g}, ${config.textColor.b})`
                          }}
                          title="Color Preview"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Template Selection */}
              <div className="mb-6 space-y-2">
                <label className="text-sm font-medium">Select Template</label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <option value="">-- Choose a Template --</option>
                  {templates.map((t) => (
                    <option key={t.fileName} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Toggle */}
              <div className="mb-6 rounded-lg bg-slate-100 p-1 flex">
                <button
                  onClick={() => setTestMode(true)}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    testMode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Test Mode
                </button>
                <button
                  onClick={() => setTestMode(false)}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    !testMode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Bulk Generate
                </button>
              </div>

              {/* Dynamic Content Based on Mode */}
              <div className="space-y-4">
                {testMode ? (
                  // Test Mode UI
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recipient Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={testName}
                          onChange={(e) => setTestName(e.target.value)}
                          placeholder="Enter name for certificate..."
                          className="pl-9 flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handlePreview}
                        disabled={isProcessing || !testName || !selectedTemplate}
                        className="flex-1 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 focus:ring-2 focus:ring-blue-600"
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="mr-2 h-4 w-4" />
                        )}
                        Preview
                      </button>
                      <button
                        onClick={handleSaveTest}
                        disabled={isProcessing || !testName || !selectedTemplate}
                        className="flex-1 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-600"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Certificate
                      </button>
                    </div>
                  </div>
                ) : (
                  // Bulk Mode UI
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <input
                        type="file"
                        id="bulk-upload"
                        className="hidden"
                        accept=".txt,.csv,.json,.xlsx,.xls"
                        onChange={handleFileSelect}
                      />
                      <label
                        htmlFor="bulk-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="h-8 w-8 text-slate-400 mb-3" />
                        <span className="text-sm font-medium text-slate-900">
                          {bulkFile ? bulkFile.name : 'Upload Data File'}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Supports .txt, .csv, .json, .xlsx
                        </span>
                      </label>
                    </div>

                    {bulkNames.length > 0 && (
                      <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Found {bulkNames.length} names to process
                      </div>
                    )}

                    <button
                      onClick={handleBulkGenerate}
                      disabled={isProcessing || bulkNames.length === 0 || !selectedTemplate}
                      className="w-full mt-4 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating {bulkNames.length} Files...
                        </>
                      ) : (
                        <>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Generate All Certificates
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History / Status Side Panel */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full max-h-[600px] flex flex-col">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Generation</h2>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {generatedRecords.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <p className="text-sm">No certificates generated yet.</p>
                  </div>
                ) : (
                  generatedRecords.map((record, i) => (
                    <div
                      key={i}
                      className="flex items-start p-3 rounded-lg border border-slate-100 bg-slate-50"
                    >
                      <div className="mt-1 mr-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {record.recipientName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{record.templateName}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(record.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
