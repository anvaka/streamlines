export default class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  equals(other) { return this.x === other.x && this.y === other.y; }
  add(other) { return new Vector(this.x + other.x, this.y + other.y); }
  mulScalar(scalar) { return new Vector(this.x * scalar, this.y * scalar); }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() { const l = this.length(); this.x /= l; this.y /= l; }
  distanceTo(other) { const dx = other.x - this.x; const dy = other.y - this.y; return Math.sqrt(dx * dx + dy * dy); }
}