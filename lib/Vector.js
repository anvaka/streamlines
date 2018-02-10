var classCallCheck = require('./classCheck');

var Vector = function () {
  function Vector(x, y) {
    classCallCheck(this, Vector);

    this.x = x;
    this.y = y;
  }

  Vector.prototype.equals = function equals(other) {
    return this.x === other.x && this.y === other.y;
  };

  Vector.prototype.add = function add(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  };

  Vector.prototype.mulScalar = function mulScalar(scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
  };

  Vector.prototype.length = function length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  Vector.prototype.normalize = function normalize() {
    var l = this.length();
    this.x /= l;
    this.y /= l;
  };

  Vector.prototype.distanceTo = function distanceTo(other) {
    var dx = other.x - this.x;
    var dy = other.y - this.y;

    return Math.sqrt(dx * dx + dy * dy);
  };

  return Vector;
}();

module.exports = Vector;