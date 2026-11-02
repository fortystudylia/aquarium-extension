// behaviors/boids.js
import { Vector2 } from '../engine/vector2.js';

const EPSILON_SQ = 1e-8;

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function steeringFromDesired(fish, desired) {
    if (desired.magSq() <= EPSILON_SQ) {
        return new Vector2(0, 0);
    }

    desired.normalize().mult(fish.maxSpeed);
    return desired.sub(fish.velocity).limit(fish.maxForce);
}

export class BoidsBehavior {
    // Boundary gradient: lực tăng dần khi cá tiến gần mép màn hình.
    // Mặc định dùng gradient tuyến tính; chưa dùng urgency phi tuyến
    // để tránh cá bị đẩy quá gắt ở vùng đệm.
    static avoidBoundaries(fish, width, height, margin = 80) {
        const marginX = Math.max(1, Math.min(margin, width * 0.4));
        const marginY = Math.max(1, Math.min(margin, height * 0.4));

        const left = clamp01((marginX - fish.position.x) / marginX);
        const right = clamp01(
            (fish.position.x - (width - marginX)) / marginX
        );
        const top = clamp01((marginY - fish.position.y) / marginY);
        const bottom = clamp01(
            (fish.position.y - (height - marginY)) / marginY
        );

        const steer = new Vector2(left - right, top - bottom);
        const strength = Math.min(1, steer.mag());

        if (strength <= 1e-4) {
            return new Vector2(0, 0);
        }

        const desired = steer.normalize().mult(fish.maxSpeed);
        const force = desired
            .sub(fish.velocity)
            .limit(fish.maxForce);

        // Giữ lại độ lớn gradient sau normalize.
        return force.mult(strength);
    }

    // Wander dùng random walk nhỏ và steering tới một điểm ảo phía trước cá.
    // sqrt(dt) giúp mức nhiễu ngẫu nhiên ổn định hơn khi FPS thay đổi.
    static wander(fish, deltaTime = 1) {
        const dt = Math.max(0, deltaTime);
        const wanderRadius = 20;
        const wanderDistance = 40;
        const change = 0.22;

        fish.wanderAngle +=
            (Math.random() * 2 - 1) * change * Math.sqrt(dt);

        const forward = Vector2.copy(fish.velocity);

        if (forward.magSq() <= EPSILON_SQ) {
            forward.set(
                Math.cos(fish.graphics.rotation),
                Math.sin(fish.graphics.rotation)
            );
        }

        forward.normalize().mult(wanderDistance);

        const offset = new Vector2(
            Math.cos(fish.wanderAngle) * wanderRadius,
            Math.sin(fish.wanderAngle) * wanderRadius
        );

        // Đây là vector tương đối từ cá tới điểm đích phía trước.
        const desired = forward.add(offset);
        return steeringFromDesired(fish, desired);
    }

    // Separation: tránh cá ở quá gần.
    static separate(fish, neighbors) {
        const desiredDistance = fish.size * 3;
        const desiredDistanceSq = desiredDistance * desiredDistance;
        const steer = new Vector2(0, 0);
        let count = 0;

        for (const other of neighbors) {
            if (other === fish) continue;

            const dx = fish.position.x - other.position.x;
            const dy = fish.position.y - other.position.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq > EPSILON_SQ && distanceSq < desiredDistanceSq) {
                // diff / distance^2: cá càng gần thì lực đẩy càng lớn.
                steer.x += dx / distanceSq;
                steer.y += dy / distanceSq;
                count++;
            }
        }

        if (count === 0) {
            return new Vector2(0, 0);
        }

        steer.div(count);
        return steeringFromDesired(fish, steer);
    }

    // Alignment: điều chỉnh vận tốc theo hướng trung bình của hàng xóm.
    static align(fish, neighbors, neighborDistance = 110) {
        const neighborDistanceSq = neighborDistance * neighborDistance;
        const averageVelocity = new Vector2(0, 0);
        let count = 0;

        for (const other of neighbors) {
            if (other === fish) continue;

            if (Vector2.distSq(fish.position, other.position) < neighborDistanceSq) {
                averageVelocity.add(other.velocity);
                count++;
            }
        }

        if (count === 0) {
            return new Vector2(0, 0);
        }

        averageVelocity.div(count);
        return steeringFromDesired(fish, averageVelocity);
    }

    // Cohesion: hướng về tâm của nhóm hàng xóm.
    static cohere(fish, neighbors, neighborDistance = 110) {
        const neighborDistanceSq = neighborDistance * neighborDistance;
        const center = new Vector2(0, 0);
        let count = 0;

        for (const other of neighbors) {
            if (other === fish) continue;

            if (Vector2.distSq(fish.position, other.position) < neighborDistanceSq) {
                center.add(other.position);
                count++;
            }
        }

        if (count === 0) {
            return new Vector2(0, 0);
        }

        center.div(count);
        return this.seek(fish, center);
    }

    // Bias yếu theo hướng ưa thích riêng của từng cá thể.
    static directionBias(fish) {
        const desired = Vector2.copy(fish.preferredDirection);
        return steeringFromDesired(fish, desired)
            .mult(fish.directionBias);
    }

    static seek(fish, target) {
        const desired = Vector2.sub(target, fish.position);
        return steeringFromDesired(fish, desired);
    }
}
