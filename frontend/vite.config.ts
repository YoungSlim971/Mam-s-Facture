import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function startupLogPlugin() {
  return {
    name: 'startup-log',
    configureServer(server: any) {
      server.httpServer?.once('listening', () => {
        const port = server.config.server.port
        console.log(`[vite] dev server running on port ${port}`)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), startupLogPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
})

