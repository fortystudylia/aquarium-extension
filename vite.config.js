import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Xử lý __dirname trong môi trường ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    base: './', // Sử dụng đường dẫn tương đối cho Chrome Extension
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                newtab: resolve(__dirname, 'newtab/index.html')
            }
        }
    }
});