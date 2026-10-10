import type { Plugin } from 'vite'
import { attachChatApi } from './server/chatApi'
import { attachGoogleAuthApi } from './server/authGoogle'

/**
 * Dev/preview middleware: chat + Google admin auth.
 * Uses process.env (loaded via loadEnv in vite.config — full .env, not VITE_ only).
 */
export function cafeChatApiPlugin(env: Record<string, string>): Plugin {
  const merged: Record<string, string | undefined> = { ...process.env, ...env }

  return {
    name: 'mana-katha-cafe-api',
    configureServer(server) {
      attachChatApi(server.middlewares, merged)
      attachGoogleAuthApi(server.middlewares, merged)
    },
    configurePreviewServer(server) {
      attachChatApi(server.middlewares, merged)
      attachGoogleAuthApi(server.middlewares, merged)
    },
  }
}
