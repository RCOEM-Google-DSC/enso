import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs/promises'
import { writeFile, existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import winico from '../../resources/icon.ico?asset'
import { initDiscordRPC, destroyDiscordRPC, setActivity, isDiscordConnected } from './discord'

// PDF Generation Imports
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

// --- CONSTANTS ---
const CERTIFICATES_DIR = join(app.getPath('userData'), 'certificate', 'template')
const TEMPLATE_DATA_FILE = join(app.getPath('userData'), 'certificate', 'template.data.json')

// Default Fallbacks
const DEFAULTS = {
  fontSize: 45,
  xOffset: 0,
  yOffset: 25,
  color: { r: 93, g: 97, b: 103 }
}

// --- HELPER FUNCTIONS ---

function wrapRGB(r: number, g: number, b: number) {
  return rgb(r / 255, g / 255, b / 255)
}

async function ensureCertificateDirectory() {
  try {
    await fs.mkdir(CERTIFICATES_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create certificate directory:', error)
  }
}

async function loadTemplateData() {
  try {
    const data = await fs.readFile(TEMPLATE_DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

async function saveTemplateData(data: any[]) {
  await fs.writeFile(TEMPLATE_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Core PDF Generation Logic
// Updated to accept 'options' for styling
async function createCertificateBuffer(
  templatePath: string,
  name: string,
  options: any = {}
): Promise<Uint8Array> {
  try {
    // Merge provided options with defaults with proper NaN handling
    const parsedFontSize = Number(options.fontSize)
    const fontSize = !isNaN(parsedFontSize) && parsedFontSize > 0 ? parsedFontSize : DEFAULTS.fontSize
    
    const parsedXOffset = Number(options.xOffset)
    const xOffset = !isNaN(parsedXOffset) ? parsedXOffset : DEFAULTS.xOffset
    
    const parsedYOffset = Number(options.yOffset)
    const yOffset = !isNaN(parsedYOffset) ? parsedYOffset : DEFAULTS.yOffset
    
    const color = options.textColor || DEFAULTS.color

    // 1. Load the PDF Template
    const existingPdfBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(existingPdfBytes)

    // 2. Register Fontkit
    pdfDoc.registerFontkit(fontkit)

    // 3. Load Custom Font
    // Priority:
    // 1. "resources/font.ttf" (Production/Dev root)
    // 2. "userData/certificate/font.ttf" (Legacy)
    let embeddedFont

    // Logic to find resource path in Electron (Dev vs Prod)
    const resourcePath = is.dev
      ? join(__dirname, '../../resources/font.ttf')
      : join(process.resourcesPath, 'font.ttf')

    const legacyPath = join(CERTIFICATES_DIR, 'font.ttf')

    let fontPathToUse = ''

    // Check if file exists (sync check for simplicity in async flow)
    const fsSync = await import('fs')
    if (fsSync.existsSync(resourcePath)) {
      fontPathToUse = resourcePath
    } else if (fsSync.existsSync(legacyPath)) {
      fontPathToUse = legacyPath
    }

    try {
      if (fontPathToUse) {
        const fontBytes = await fs.readFile(fontPathToUse)
        embeddedFont = await pdfDoc.embedFont(fontBytes, { subset: true })
      } else {
        throw new Error('Font file not found')
      }
    } catch (e) {
      console.warn(`Custom font not found at ${fontPathToUse || 'resources'}, using Helvetica.`)
      embeddedFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    }

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // 4. Calculate Text Width
    const textWidth = embeddedFont.widthOfTextAtSize(name, fontSize)

    // 5. Position Logic (Centered with offsets)
    const x = (width - textWidth) / 2 + xOffset
    // Vertical offset logic: Center + Offset
    const y = (height - fontSize) / 2 + yOffset

    // 6. Draw Text
    firstPage.drawText(name, {
      x: x,
      y: y,
      size: fontSize,
      font: embeddedFont,
      color: wrapRGB(color.r, color.g, color.b)
    })

    return await pdfDoc.save()
  } catch (error) {
    console.error('Error creating certificate buffer:', error)
    throw error
  }
}

// --- WINDOW MANAGEMENT ---

let previewWindows: BrowserWindow[] = []
let mainWindow: BrowserWindow | null = null

function createPreviewWindow(filePath: string): void {
  const previewWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    title: 'PDF Preview',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      plugins: true
    }
  })

  previewWindow.loadFile(filePath)

  previewWindow.on('closed', () => {
    const index = previewWindows.indexOf(previewWindow)
    if (index > -1) {
      previewWindows.splice(index, 1)
    }
  })

  previewWindows.push(previewWindow)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    icon: winico,
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- APP INITIALIZATION ---

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('dev.gdgrbu')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await ensureCertificateDirectory()
  await initDiscordRPC()
  createWindow()

  // Discord Activity
  setActivity({
    details: 'Analyzing & automating',
    state: 'Working',
    largeImageKey: 'https://i.pinimg.com/1200x/2c/36/44/2c364466678be55dfacfe65c673844c1.jpg',
    largeImageText: 'ENSO',
    smallImageKey: 'gdg',
    smallImageText: 'GDG'
  })

  ipcMain.handle('discord:setActivity', async (_event, options) => {
    await setActivity(options)
  })

  ipcMain.handle('discord:isConnected', () => {
    return isDiscordConnected()
  })

  // --- WINDOW CONTROL HANDLERS ---
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow?.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() || false
  })

  // --- DATA HANDLERS ---
  const getDataFilePath = (filename: string): string => {
    if (filename === 'generated.certificates.json') {
      return join(app.getPath('userData'), filename)
    }
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      return join(process.cwd(), 'src', 'renderer', 'src', 'data', filename)
    } else {
      return join(app.getPath('userData'), filename)
    }
  }

  ipcMain.handle('data:load', async (_event, dataFile: string) => {
    try {
      const dataPath = getDataFilePath(dataFile)
      let raw = '[]'
      try {
        raw = await fs.readFile(dataPath, 'utf8')
      } catch (e) {
        // If it's the settings file, return null/empty object if missing
        if (dataFile.includes('settings')) return { ok: true, path: dataPath, data: {} }
        return { ok: true, path: dataPath, data: [] }
      }
      return { ok: true, path: dataPath, data: JSON.parse(raw) || [] }
    } catch (err) {
      console.error('Failed to load data', err)
      return { ok: false, error: String(err) }
    }
  })

  ipcMain.handle('data:save', async (_event, dataFile: string, data: any) => {
    try {
      const dataPath = getDataFilePath(dataFile)
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8')
      return { ok: true, path: dataPath, data }
    } catch (err) {
      console.error('Failed to save data', err)
      return { ok: false, error: String(err) }
    }
  })

  // --- TEMPLATE UPLOAD HANDLERS ---

  ipcMain.handle('get-templates', async () => {
    try {
      return await loadTemplateData()
    } catch (error) {
      console.error('Failed to get templates:', error)
      return []
    }
  })

  ipcMain.handle('upload-template', async (_event, { name, fileBuffer }) => {
    try {
      await ensureCertificateDirectory()
      const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const fileName = `${sanitizedName}.pdf`
      const filePath = join(CERTIFICATES_DIR, fileName)

      await fs.writeFile(filePath, Buffer.from(fileBuffer))

      const templates = await loadTemplateData()
      templates.push({
        name: name,
        fileName: fileName,
        uploadDate: new Date().toISOString()
      })
      await saveTemplateData(templates)

      return { success: true, filePath: filePath }
    } catch (error) {
      console.error('Failed to upload template:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('preview-pdf', async (_event, { fileName, fileBuffer }) => {
    try {
      const tempDir = join(app.getPath('temp'), 'enso-previews')
      await fs.mkdir(tempDir, { recursive: true })
      const tempFilePath = join(tempDir, fileName)
      await writeFile(tempFilePath, Buffer.from(fileBuffer))
      createPreviewWindow(tempFilePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('get-template-path', async (_event, fileName) => {
    return { success: true, filePath: join(CERTIFICATES_DIR, fileName) }
  })

  ipcMain.on('open-pdf', async (_event, filePath) => {
    await shell.openPath(filePath)
  })

  // Delete template handler
  ipcMain.handle('delete-template', async (_event, fileName) => {
    try {
      const filePath = join(CERTIFICATES_DIR, fileName)
      
      // Delete the PDF file
      await fs.unlink(filePath)
      
      // Update template data
      const templates = await loadTemplateData()
      const updatedTemplates = templates.filter((t: any) => t.fileName !== fileName)
      await saveTemplateData(updatedTemplates)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to delete template:', error)
      return { success: false, error: String(error) }
    }
  })

  // --- CERTIFICATE GENERATOR HANDLERS ---

  // 1. Generate Preview (Applied Name & Config)
  ipcMain.handle('generate-preview', async (_event, { templateFileName, data, options }) => {
    try {
      const templatePath = join(CERTIFICATES_DIR, templateFileName)
      const pdfBytes = await createCertificateBuffer(templatePath, data.name, options)

      const tempDir = join(app.getPath('temp'), 'enso-previews')
      await fs.mkdir(tempDir, { recursive: true })

      const previewPath = join(tempDir, `preview_gen_${Date.now()}.pdf`)
      await fs.writeFile(previewPath, pdfBytes)

      createPreviewWindow(previewPath)
      return { success: true }
    } catch (error) {
      console.error('Preview generation failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // 2. Generate and Save Single
  ipcMain.handle(
    'generate-save-single',
    async (_event, { templateFileName, templateName, data, options }) => {
      try {
        const { filePath } = await dialog.showSaveDialog({
          title: 'Save Certificate',
          defaultPath: `${templateName}_${data.name}.pdf`,
          filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
        })

        if (!filePath) return { success: false, reason: 'cancelled' }

        const templatePath = join(CERTIFICATES_DIR, templateFileName)
        const pdfBytes = await createCertificateBuffer(templatePath, data.name, options)

        await fs.writeFile(filePath, pdfBytes)
        return { success: true, path: filePath }
      } catch (error) {
        console.error('Save failed:', error)
        return { success: false, error: String(error) }
      }
    }
  )

  // 3. Bulk Generate
  ipcMain.handle(
    'generate-bulk',
    async (_event, { templateFileName, templateName, names, options }) => {
      try {
        const { filePaths } = await dialog.showOpenDialog({
          title: 'Select Output Folder',
          properties: ['openDirectory', 'createDirectory']
        })

        if (filePaths.length === 0) return { success: false, reason: 'cancelled' }

        const baseOutputDir = filePaths[0]
        const specificDir = join(baseOutputDir, 'Certificate', templateName)
        await fs.mkdir(specificDir, { recursive: true })

        const templatePath = join(CERTIFICATES_DIR, templateFileName)
        let count = 0

        for (const name of names) {
          if (!name) continue
          try {
            const pdfBytes = await createCertificateBuffer(templatePath, name, options)
            const safeName = name.replace(/[^a-z0-9]/gi, '_')
            const finalPath = join(specificDir, `${templateName}_${safeName}.pdf`)
            await fs.writeFile(finalPath, pdfBytes)
            count++
          } catch (err) {
            console.error(`Failed to generate for ${name}`, err)
          }
        }

        return { success: true, count, folder: specificDir }
      } catch (error) {
        console.error('Bulk generation failed:', error)
        return { success: false, error: String(error) }
      }
    }
  )
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  destroyDiscordRPC()
})

app.on('before-quit', () => {
  previewWindows.forEach((window) => {
    if (!window.isDestroyed()) window.close()
  })
})
