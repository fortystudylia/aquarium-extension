// newtab/app.js
import { AquariumRenderer } from '../engine/renderer.js';
import { Aquarium } from '../engine/aquarium.js';

class Application {
    constructor() {
        this.renderer = new AquariumRenderer('aquarium-canvas');
        this.aquarium = null;
        this.updateCallback = null;
    }

    async init() {
        // Chờ WebGL/PixiJS 8 khởi tạo hoàn tất.
        await this.renderer.init();

        // Khởi tạo hệ sinh thái sau khi Stage sẵn sàng.
        this.aquarium = new Aquarium(this.renderer.app, {
            initialFishCount: 30
        });

        // deltaTime là hệ số frame (~1 tại 60 FPS), không phải ms.
        this.updateCallback = (ticker) => {
            this.aquarium?.update(ticker.deltaTime);
        };

        this.renderer.getTicker().add(this.updateCallback);

        // Giữ nguyên các chức năng giao diện từ Giai đoạn 1.
        this.setupVisibilityHandling();
        this.setupSearch();
        this.setupSettingsButton();

        window.addEventListener('pagehide', this.handlePageHide, {
            once: true
        });
    }

    setupVisibilityHandling() {
        const ticker = this.renderer.getTicker();

        this.visibilityHandler = () => {
            if (document.hidden) {
                ticker.stop();
            } else {
                ticker.start();
            }
        };

        document.addEventListener(
            'visibilitychange',
            this.visibilityHandler
        );

        // Xử lý trường hợp tab đã ẩn trước khi listener được gắn.
        this.visibilityHandler();
    }

    setupSearch() {
        const form = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');

        if (!form || !searchInput) {
            console.warn('Không tìm thấy search-form hoặc search-input.');
            return;
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const query = searchInput.value.trim();
            if (!query) return;

            window.location.href =
                `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        });
    }

    setupSettingsButton() {
        const button = document.getElementById('settings-btn');

        if (!button) return;

        button.addEventListener('click', () => {
            console.log(
                'Chức năng cài đặt sẽ được phát triển trong giai đoạn sau.'
            );
        });
    }

    handlePageHide = () => {
        const ticker = this.renderer.getTicker();

        if (this.updateCallback) {
            ticker.remove(this.updateCallback);
        }

        if (this.visibilityHandler) {
            document.removeEventListener(
                'visibilitychange',
                this.visibilityHandler
            );
        }

        this.aquarium?.destroy();
        this.renderer.destroy();
    };
}

// Khởi chạy và giữ fallback nếu WebGL/PixiJS không khởi tạo được.
document.addEventListener('DOMContentLoaded', async () => {
    const app = new Application();

    try {
        await app.init();
    } catch (error) {
        console.error('Aquarium initialization failed:', error);
        document.body.classList.add('aquarium-error');
    }
});
