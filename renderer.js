import 'pixi.js/unsafe-eval';
import { Application } from 'pixi.js';

class AquariumRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.app = new Application();
        this.initialized = false;
    }

    async init() {
        await this.app.init({
            canvas: this.canvas,
            resizeTo: window,
            autoDensity: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
            background: 0x0f2c59,
            antialias: true
        });

        this.initialized = true;
    }

    getStage() {
        return this.app.stage;
    }

    getTicker() {
        return this.app.ticker;
    }

    destroy() {
        if (!this.initialized) return;
        
        // Dừng tính toán khung hình
        this.app.ticker.stop();
        
        // Hủy an toàn, giữ lại Canvas và không hủy Texture dùng chung
        this.app.destroy(
            { removeView: false },
            {
                children: true,
                texture: false,
                textureSource: false
            }
        );
        
        this.initialized = false;
    }
}

export { AquariumRenderer };