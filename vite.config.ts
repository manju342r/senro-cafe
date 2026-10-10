import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { cafeChatApiPlugin } from './vite-plugin-chat-api'

export default defineConfig(({ mode }) => {
  // Load all env vars (including OPENAI_API_KEY) for the server plugin only.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), cafeChatApiPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
    },
  }
})
