/** Stable critically-damped-ish spring for one scalar (organic morphing). */
export class Spring {
  value: number;
  target: number;
  velocity = 0;
  constructor(value = 0, public stiffness = 120, public damping = 1) {
    this.value = value;
    this.target = value;
  }
  set(t: number) { this.target = t; }
  reset(v: number) { this.value = v; this.target = v; this.velocity = 0; }
  update(dt: number) {
    if (dt <= 0) return this.value;
    const h = Math.min(dt, 0.05);
    const steps = Math.max(1, Math.ceil(h / 0.008));
    const s = h / steps;
    const c = 2 * Math.sqrt(this.stiffness) * this.damping;
    for (let i = 0; i < steps; i++) {
      const a = -this.stiffness * (this.value - this.target) - c * this.velocity;
      this.velocity += a * s;
      this.value += this.velocity * s;
    }
    return this.value;
  }
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
