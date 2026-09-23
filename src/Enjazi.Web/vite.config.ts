import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Ports are pinned; see CLAUDE.md "Fixed local ports". strictPort makes a
// taken port fail instead of silently moving to the next one.
//
// /api is proxied to the API so the browser sees one origin. The auth cookie
// is then first-party, no CORS configuration is needed, and the client uses
// relative URLs that also hold in production behind one host. ADR-0008.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5182,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:5180',
      // The SignalR hub. ws: true forwards the WebSocket upgrade, and the
      // cookie goes with it because the hub is on the app's own origin.
      '/hubs': { target: 'http://127.0.0.1:5180', ws: true },
    },
  },
})
