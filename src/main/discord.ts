import DiscordRPC from 'discord-rpc'

const CLIENT_ID = process.env.MAIN_VITE_DISCORD_CLIENT_ID || '1431767009867075594'
const RECONNECT_DELAY = 5000 // 5 seconds

let rpc: DiscordRPC.Client | null = null
let isConnected = false
let reconnectTimeout: NodeJS.Timeout | null = null
let shouldReconnect = true

interface ActivityOptions {
  details?: string
  state?: string
  startTimestamp?: number
  largeImageKey?: string
  largeImageText?: string
  smallImageKey?: string
  smallImageText?: string
}

async function attemptConnection(): Promise<boolean> {
  if (isConnected && rpc) {
    return true
  }

  try {
    if (rpc) {
      await rpc.destroy().catch(console.error)
    }

    rpc = new DiscordRPC.Client({ transport: 'ipc' })

    rpc.on('ready', () => {
      console.log('Discord RPC Connected')
      isConnected = true
      // Clear any pending reconnect attempts
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
    })

    rpc.on('disconnected', () => {
      console.log('Discord RPC Disconnected')
      isConnected = false
      rpc = null

      // Attempt to reconnect if we should
      if (shouldReconnect) {
        scheduleReconnect()
      }
    })

    await rpc.login({ clientId: CLIENT_ID })
    return true
  } catch (error) {
    console.error(
      'Failed to initialize Discord RPC:',
      error instanceof Error ? error.message : error
    )
    isConnected = false
    rpc = null

    // Schedule reconnect on failure
    if (shouldReconnect) {
      scheduleReconnect()
    }

    return false
  }
}

function scheduleReconnect(): void {
  // Don't schedule if already scheduled
  if (reconnectTimeout) {
    return
  }

  console.log(`Scheduling Discord RPC reconnect in ${RECONNECT_DELAY / 1000} seconds...`)
  reconnectTimeout = setTimeout(async () => {
    reconnectTimeout = null
    console.log('Attempting to reconnect Discord RPC...')
    await attemptConnection()
  }, RECONNECT_DELAY)
}

export async function initDiscordRPC(): Promise<boolean> {
  shouldReconnect = true
  return attemptConnection()
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
    await rpc.setActivity({
      details: options.details ?? undefined,
      state: options.state ?? undefined,
      largeImageKey: options.largeImageKey ?? undefined,
      largeImageText: options.largeImageText ?? undefined,
      smallImageKey: options.smallImageKey ?? 'gdg',
      smallImageText: options.smallImageText ?? 'GDG',
      instance: false,
      startTimestamp: options.startTimestamp ?? getAppStartTimestamp()
    })
  } catch (error) {
    console.error('Failed to set Discord activity:', error instanceof Error ? error.message : error)
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
  shouldReconnect = false

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

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
