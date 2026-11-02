// entities/fish.js
import { Graphics } from 'pixi.js';
import { Vector2 } from '../engine/vector2.js';
import { BoidsBehavior } from '../behaviors/boids.js';

const FISH_COLORS = [
    0xFFD166,
    0xFF7F50,
    0x4CC9F0,
    0x80ED99,
    0xF4A6C1,
    0xFFFFFF
];

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function shortestAngleDifference(target, current) {
    const difference = target - current;
    return Math.atan2(Math.sin(difference), Math.cos(difference));
}

export class Fish {
    constructor(x, y) {
        this.position = new Vector2(x, y);

        // Personality: mỗi cá có tốc độ, lực lái và độ xoay riêng.
        this.size = randomBetween(8, 16);
        this.maxSpeed = randomBetween(1.5, 3.0);
        this.maxForce = randomBetween(0.04, 0.07);
        this.rotationSmoothing = randomBetween(0.08, 0.23);

        const initialAngle = Math.random() * Math.PI * 2;
        const initialSpeed = this.maxSpeed * randomBetween(0.55, 0.8);

        this.velocity = new Vector2(
            Math.cos(initialAngle) * initialSpeed,
            Math.sin(initialAngle) * initialSpeed
        );

        this.acceleration = new Vector2(0, 0);

        // Trọng số Boids khác nhau giữa các cá thể.
        this.weightSeparation = randomBetween(1.4, 2.2);
        this.weightAlignment = randomBetween(0.7, 1.3);
        this.weightCohesion = randomBetween(0.6, 1.2);
        this.weightWander = randomBetween(0.25, 0.55);
        this.weightBoundary = 1.5;

        // Hướng ưa thích và mức ảnh hưởng nhỏ để không phá đàn.
        this.preferredAngle = Math.random() * Math.PI * 2;
        this.preferredTargetAngle = this.preferredAngle;
        this.preferredDirection = new Vector2(
            Math.cos(this.preferredAngle),
            Math.sin(this.preferredAngle)
        );
        this.directionBias = randomBetween(0.02, 0.15);

        // Mood drift: thỉnh thoảng chọn hướng ưa thích mới,
        // sau đó chuyển dần sang hướng mới thay vì đổi đột ngột.
        this.preferredTargetTimer = randomBetween(900, 1800);
        this.preferredTurnRate = 1 / 300;

        this.wanderAngle = Math.random() * Math.PI * 2;

        // Speed modulation: cua gắt thì giảm tốc nhẹ.
        this.speedScale = 1;
        this.maxTurnRate = 0.12;
        this.turnSlowdown = 0.25;

        this.color = FISH_COLORS[
            Math.floor(Math.random() * FISH_COLORS.length)
        ];

        this.graphics = new Graphics();
        this.graphics.rotation = initialAngle;
        this.drawFish();
        this.graphics.position.set(x, y);
    }

    drawFish() {
        this.graphics.clear();

        // Thân cá hướng về trục +X.
        this.graphics
            .ellipse(0, 0, this.size, this.size * 0.5)
            .fill(this.color);

        // Đuôi cá.
        this.graphics
            .moveTo(-this.size + 2, 0)
            .lineTo(-this.size - 10, -this.size / 1.5)
            .lineTo(-this.size - 10, this.size / 1.5)
            .closePath()
            .fill(this.color);

        // Mắt nhỏ để dễ nhận biết đầu cá khi đổi hướng.
        this.graphics
            .circle(this.size * 0.55, -this.size * 0.12, Math.max(1, this.size * 0.075))
            .fill(0x082B45);
    }

    updatePreferredDirection(deltaTime) {
        this.preferredTargetTimer -= deltaTime;

        if (this.preferredTargetTimer <= 0) {
            // Chuyển "tâm trạng" một góc nhỏ, giữ cá có cá tính ổn định.
            const moodChange = randomBetween(-0.65, 0.65);
            this.preferredTargetAngle += moodChange;
            this.preferredTargetTimer = randomBetween(900, 1800);
        }

        const difference = shortestAngleDifference(
            this.preferredTargetAngle,
            this.preferredAngle
        );

        const alpha = 1 - Math.exp(-this.preferredTurnRate * deltaTime);
        this.preferredAngle += difference * alpha;

        this.preferredDirection.set(
            Math.cos(this.preferredAngle),
            Math.sin(this.preferredAngle)
        );
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    flock(fishes, width, height, deltaTime = 1) {
        const separation = BoidsBehavior.separate(this, fishes);
        const alignment = BoidsBehavior.align(this, fishes);
        const cohesion = BoidsBehavior.cohere(this, fishes);
        const boundary = BoidsBehavior.avoidBoundaries(
            this,
            width,
            height,
            80
        );
        const wander = BoidsBehavior.wander(this, deltaTime);
        const bias = BoidsBehavior.directionBias(this);

        separation.mult(this.weightSeparation);
        alignment.mult(this.weightAlignment);
        cohesion.mult(this.weightCohesion);
        boundary.mult(this.weightBoundary);
        wander.mult(this.weightWander);

        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(boundary);
        this.applyForce(wander);
        this.applyForce(bias);

        // Giới hạn tổng hợp lực sau khi cộng mọi nguồn steering.
        this.acceleration.limit(this.maxForce * 2);
    }

    update(width, height, deltaTime = 1) {
        const dt = Math.max(0, Math.min(deltaTime, 2));
        if (dt === 0) return;

        this.updatePreferredDirection(dt);

        // Tích phân chuyển động: chỉ nhân deltaTime tại đây.
        this.velocity.add(
            Vector2.copy(this.acceleration).mult(dt)
        );

        this.velocity.limit(this.maxSpeed * this.speedScale);

        this.position.add(
            Vector2.copy(this.velocity).mult(dt)
        );

        // Xóa gia tốc sau khi đã tích phân, không xóa ở đầu flock().
        this.acceleration.set(0, 0);

        // Rotation smoothing theo đường góc ngắn nhất và độc lập FPS.
        const oldRotation = this.graphics.rotation;
        const speedSq = this.velocity.magSq();

        if (speedSq > 1e-8) {
            const targetRotation = this.velocity.heading();
            const difference = shortestAngleDifference(
                targetRotation,
                oldRotation
            );

            const rotationAlpha =
                1 - Math.pow(1 - this.rotationSmoothing, dt);

            this.graphics.rotation += difference * rotationAlpha;

            // Tính angular velocity từ góc thực sự đã xoay,
            // không dùng sai lệch target (error signal).
            const actualRotationDelta = shortestAngleDifference(
                this.graphics.rotation,
                oldRotation
            );

            const angularVelocity = Math.abs(actualRotationDelta) / dt;
            const turnIntensity = Math.max(
                0,
                Math.min(1, angularVelocity / this.maxTurnRate)
            );

            const targetSpeedScale =
                1 - turnIntensity * this.turnSlowdown;

            const speedAlpha = 1 - Math.exp(-dt / 8);
            this.speedScale +=
                (targetSpeedScale - this.speedScale) * speedAlpha;
        }

        this.speedScale = Math.max(
            1 - this.turnSlowdown,
            Math.min(1, this.speedScale)
        );

        // Giới hạn lại cho bước mô phỏng kế tiếp theo tốc độ khi cua.
        this.velocity.limit(this.maxSpeed * this.speedScale);

        this.graphics.position.set(
            this.position.x,
            this.position.y
        );
    }
}
