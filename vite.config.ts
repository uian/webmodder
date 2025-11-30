import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Maps process.env.API_KEY code references to the global window variable
    // which allows us to inject the key at runtime in the Docker container.
    'process.env.API_KEY': 'window.ENV_API_KEY'
  }
});