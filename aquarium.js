// engine/aquarium.js
import { Container } from 'pixi.js';
import { Fish } from '../entities/fish.js';

export class Aquarium {
    constructor(app, options = {}) {
        this.app = app;
        this.fishes = [];
        this.container = new Container();
        this.app.stage.addChild(this.container);

        this.initialFishCount = options.initialFishCount ?? 20;
        this.addFish(this.initialFishCount);
    }

    addFish(count = 1) {
        const width = this.app.screen.width;
        const height = this.app.screen.height;

        const marginX = Math.min(80, width * 0.25);
        const marginY = Math.min(80, height * 0.25);
        const usableWidth = Math.max(1, width - marginX * 2);
        const usableHeight = Math.max(1, height - marginY * 2);

        for (let i = 0; i < count; i++) {
            const x = marginX + Math.random() * usableWidth;
            const y = marginY + Math.random() * usableHeight;
            const fish = new Fish(x, y);

            this.fishes.push(fish);
            this.container.addChild(fish.graphics);
        }
    }

    update(deltaTime = 1) {
        // PixiJS ticker.deltaTime là hệ số frame (xấp xỉ 1 ở 60 FPS),
        // không phải mili giây. Clamp lag spike để tránh teleport.
        const dt = Math.max(
            0,
            Math.min(Number.isFinite(deltaTime) ? deltaTime : 1, 2)
        );

        if (dt === 0) return;

        const width = this.app.screen.width;
        const height = this.app.screen.height;

        // Tính lực cho toàn đàn trước khi cập nhật vị trí:
        // mọi cá cùng đọc trạng thái ở đầu bước mô phỏng.
        for (const fish of this.fishes) {
            fish.flock(this.fishes, width, height, dt);
        }

        for (const fish of this.fishes) {
            fish.update(width, height, dt);
        }
    }

    destroy() {
        this.fishes.length = 0;

        // Gỡ Container khỏi Stage trước khi hủy để Renderer không
        // cố hủy lại cùng một cây đối tượng khi Application.destroy().
        this.app.stage.removeChild(this.container);
        this.container.destroy({ children: true });
    }
}
