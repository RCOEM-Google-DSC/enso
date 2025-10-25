import DiscordRPC from 'discord-rpc'

// const CLIENT_ID = '1428844411688849408'
const CLIENT_ID = '1431767009867075594'

let rpc: DiscordRPC.Client | null = null
let isConnected = false

interface ActivityOptions {
  details?: string
  state?: string
  startTimestamp?: number
  largeImageKey?: string
  largeImageText?: string
  smallImageKey?: string
  smallImageText?: string
}

export async function initDiscordRPC(): Promise<boolean> {
  if (isConnected) {
    console.log('Discord RPC already connected')
    return true
  }

  try {
    rpc = new DiscordRPC.Client({ transport: 'ipc' })

    rpc.on('ready', () => {
      console.log('Discord RPC Connected')
      isConnected = true
      // setActivity()
    })

    rpc.on('disconnected', () => {
      console.log('Discord RPC Disconnected')
      isConnected = false
    })

    await rpc.login({ clientId: CLIENT_ID })
    return true
  } catch (error) {
    console.error('Failed to initialize Discord RPC:', error)
    isConnected = false
    rpc = null
    return false
  }
}

// Store the initial timestamp when app starts
let appStartTimestamp: number | null = null

export function getAppStartTimestamp(): number {
  if (!appStartTimestamp) {
    appStartTimestamp = Date.now()
  }
  return appStartTimestamp
}

export async function setActivity(options: ActivityOptions): Promise<void> {
  if (!rpc || !isConnected) {
    console.warn('Discord RPC not connected')
    return
  }

  try {
    rpc.setActivity({
      details: options.details,
      state: options.state,
      largeImageKey: options.largeImageKey,
      largeImageText: options.largeImageText,
      smallImageKey: options.smallImageKey || 'gdg',
      smallImageText: options.smallImageText || 'GDG',
      instance: false,
      startTimestamp: options.startTimestamp || getAppStartTimestamp()
    })
    console.log('Discord activity set:', options)
  } catch (error) {
    console.error('Failed to set Discord activity:', error)
  }
}

export async function clearActivity(): Promise<void> {
  if (!rpc || !isConnected) {
    console.warn('Discord RPC not connected')
    return
  }

  try {
    await rpc.clearActivity()
  } catch (error) {
    console.error('Failed to clear Discord activity:', error)
  }
}

export function destroyDiscordRPC() {
  if (rpc) {
    try {
      rpc.destroy()
    } catch (error) {
      console.error('Error destroying Discord RPC:', error)
    }
    rpc = null
    isConnected = false
  }
}

export function isDiscordConnected(): boolean {
  return isConnected
}
