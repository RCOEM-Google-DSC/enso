export type FileFormat = 'excel' | 'csv' | 'json'

export interface FileStats {
  rows: number
  columns: number
}

export interface ParsedFileResult {
  previewData: any[]
  fileStats: FileStats
}

export const detectFileFormat = (fileName: string): FileFormat => {
  const supported = getSupportedFormat(fileName)
  return supported ?? 'json'
}

/**
 * Return the supported FileFormat for a filename, or null if unsupported.
 * Use this helper to validate uploads before attempting to parse.
 */
export const getSupportedFormat = (fileName: string): FileFormat | null => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (!extension) return null
  if (extension === 'json') return 'json'
  if (extension === 'csv') return 'csv'
  if (extension === 'xlsx' || extension === 'xls') return 'excel'
  return null
}

export const parseCSVText = (text: string): any[] => {
  const lines = text.split('\n').filter((line) => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const data = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })

  return data
}

export const parseFileText = (text: string, format: FileFormat): ParsedFileResult => {
  if (format === 'csv' || format === 'excel') {
    const parsed = parseCSVText(text)
    return {
      previewData: parsed,
      fileStats: {
        rows: parsed.length,
        columns: parsed.length > 0 ? Object.keys(parsed[0]).length : 0
      }
    }
  }

  // JSON
  const parsed = JSON.parse(text)
  const dataArray = Array.isArray(parsed) ? parsed : [parsed]

  return {
    previewData: dataArray,
    fileStats: {
      rows: dataArray.length,
      columns: dataArray.length > 0 ? Object.keys(dataArray[0]).length : 0
    }
  }
}

/**
 * Convert array of objects to CSV text
 */
export const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}

/**
 * Convert parsed preview data into target format (JSON/CSV/Excel-compatible CSV)
 */
export const convertData = (previewData: any, targetFormat: FileFormat): string => {
  if (targetFormat === 'json') {
    return JSON.stringify(previewData, null, 2)
  }

  const dataArray = Array.isArray(previewData) ? previewData : [previewData]
  return convertToCSV(dataArray)
}
