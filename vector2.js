// engine/vector2.js
// Vector 2D nhỏ gọn dùng chung cho vật lý và steering.

export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    mag() {
        return Math.sqrt(this.magSq());
    }

    normalize() {
        const magnitude = this.mag();
        if (magnitude > 1e-12) {
            this.div(magnitude);
        }
        return this;
    }

    limit(max) {
        const safeMax = Math.max(0, max);
        const magnitudeSq = this.magSq();

        if (magnitudeSq > safeMax * safeMax) {
            this.normalize().mult(safeMax);
        }

        return this;
    }

    heading() {
        return Math.atan2(this.y, this.x);
    }

    static sub(a, b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    static distSq(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    static dist(a, b) {
        return Math.sqrt(Vector2.distSq(a, b));
    }

    static copy(v) {
        return new Vector2(v.x, v.y);
    }
}
