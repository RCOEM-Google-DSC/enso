/* eslint-disable @typescript-eslint/no-explicit-any */

import * as XLSX from 'xlsx'

interface ProcessedData {
  id: string
  name: string
  email: string
  pdfs: string[]
}

export const parseFile = (file: File): Promise<ProcessedData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawData = XLSX.utils.sheet_to_json(firstSheet)
        const processedData = transformData(rawData)
        resolve(processedData)
      } catch (error) {
        reject(error)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

const transformData = (rawData: any[]): ProcessedData[] => {
  const idColumn = findIdColumn(rawData[0])

  return rawData.map((row, index) => {
    const pdfColumns = Object.keys(row).filter((key) => key.toLowerCase().includes('pdf'))

    const pdfs = pdfColumns
      .map((col) => row[col])
      .filter((pdf) => pdf)
      .flatMap((pdf) =>
        // Split by comma if it's a string containing commas, otherwise keep as is
        typeof pdf === 'string' && pdf.includes(',') ? pdf.split(',').map((p) => p.trim()) : pdf
      )

    return {
      id: row[idColumn] || (index + 1).toString(),
      name: findValue(row, ['name', 'fullname', 'full_name']),
      email: findValue(row, ['email', 'e-mail', 'mail']),
      pdfs
    }
  })
}

const findIdColumn = (firstRow: any): string => {
  const possibleIds = ['id', 'rid', 'userid', 'user_id']
  return Object.keys(firstRow).find((key) => possibleIds.includes(key.toLowerCase())) || 'id'
}

const findValue = (row: any, possibleKeys: string[]): string => {
  const key = Object.keys(row).find((k) => possibleKeys.includes(k.toLowerCase()))
  return key ? row[key] : ''
}
