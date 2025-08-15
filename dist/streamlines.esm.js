class A {
  constructor(e, t) {
    this.x = e, this.y = t;
  }
  equals(e) {
    return this.x === e.x && this.y === e.y;
  }
  add(e) {
    return new A(this.x + e.x, this.y + e.y);
  }
  mulScalar(e) {
    return new A(this.x * e, this.y * e);
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  normalize() {
    const e = this.length();
    this.x /= e, this.y /= e;
  }
  distanceTo(e) {
    const t = e.x - this.x, u = e.y - this.y;
    return Math.sqrt(t * t + u * u);
  }
}
function W(r, e) {
  if (!(r instanceof e))
    throw new TypeError("Cannot call a class as a function");
}
var K = (function() {
  function r() {
    W(this, r), this.children = null;
  }
  return r.prototype.occupy = function(t) {
    this.children || (this.children = []), this.children.push(t);
  }, r.prototype.isTaken = function(t, u, f) {
    if (!this.children) return !1;
    for (var o = 0; o < this.children.length; ++o) {
      var s = this.children[o], a = s.x - t, l = s.y - u, m = Math.sqrt(a * a + l * l);
      if (f(m, s)) return !0;
    }
    return !1;
  }, r.prototype.getMinDistance = function(t, u) {
    let f = 1 / 0;
    if (!this.children) return f;
    for (var o = 0; o < this.children.length; ++o) {
      var s = this.children[o], a = s.x - t, l = s.y - u, m = Math.sqrt(a * a + l * l);
      m < f && (f = m);
    }
    return f;
  }, r;
})();
function U(r, e) {
  var t = Math.max(r.width, r.height), u = Math.ceil(t / e), f = /* @__PURE__ */ new Map(), o = {
    occupyCoordinates: l,
    isTaken: m,
    isOutside: a,
    findNearest: s
  };
  return o;
  function s(h, c) {
    var T = E(h), y = x(c);
    let g = 1 / 0;
    for (var v = -1; v < 2; ++v) {
      var w = T + v;
      if (!(w < 0 || w >= u)) {
        var n = f.get(w);
        if (n)
          for (var i = -1; i < 2; ++i) {
            var d = y + i;
            if (d < 0 || d >= u) continue;
            var S = n.get(d);
            if (!S) continue;
            let P = S.getMinDistance(h, c);
            P < g && (g = P);
          }
      }
    }
    return g;
  }
  function a(h, c) {
    return h < r.left || h > r.left + r.width || c < r.top || c > r.top + r.height;
  }
  function l(h) {
    var c = h.x, T = h.y;
    k(c, T).occupy(h);
  }
  function m(h, c, T) {
    if (!f) return !1;
    for (var y = E(h), g = x(c), v = -1; v < 2; ++v) {
      var w = y + v;
      if (!(w < 0 || w >= u)) {
        var n = f.get(w);
        if (n)
          for (var i = -1; i < 2; ++i) {
            var d = g + i;
            if (!(d < 0 || d >= u)) {
              var S = n.get(d);
              if (S && S.isTaken(h, c, T))
                return !0;
            }
          }
      }
    }
    return !1;
  }
  function k(h, c) {
    I(h, c);
    var T = E(h), y = f.get(T);
    y || (y = /* @__PURE__ */ new Map(), f.set(T, y));
    var g = x(c), v = y.get(g);
    return v || (v = new K(), y.set(g, v)), v;
  }
  function E(h) {
    return Math.floor(u * (h - r.left) / t);
  }
  function x(h) {
    return Math.floor(u * (h - r.top) / t);
  }
  function I(h, c) {
    if (r.left > h || r.left + t < h)
      throw new Error("x is out of bounds");
    if (r.top > c || r.top + t < c)
      throw new Error("y is out of bounds");
  }
}
function z(r, e, t) {
  var u = t(r);
  if (u) {
    var f = t(r.add(u.mulScalar(e * 0.5)));
    if (f) {
      var o = t(r.add(f.mulScalar(e * 0.5)));
      if (o) {
        var s = t(r.add(o.mulScalar(e)));
        if (s) {
          var a = u.mulScalar(e / 6).add(f.mulScalar(e / 3)).add(o.mulScalar(e / 3)).add(s.mulScalar(e / 6));
          return a;
        }
      }
    }
  }
}
var D = 1, L = 2, M = 3;
function _(r, e, t) {
  var u = [r], f = r, o = D, s = null, a = -1, l = U(t.boundingBox, t.timeStep * 0.9);
  return {
    start: r,
    next: I,
    getStreamline: m,
    getNextValidSeed: k
  };
  function m() {
    return u;
  }
  function k() {
    for (; a < u.length - 1; ) {
      a += 1;
      var n = u[a], i = w(n);
      if (i) {
        var d = n.x - i.y * t.dSep, S = n.y + i.x * t.dSep;
        if (Array.isArray(t.seedArray) && t.seedArray.length > 0) {
          var P = t.seedArray.shift();
          d = P.x, S = P.y;
        }
        if (!e.isOutside(d, S) && !e.isTaken(d, S, x))
          return a -= 1, new A(d, S);
        var B = n.x + i.y * t.dSep, p = n.y - i.x * t.dSep;
        if (!e.isOutside(B, p) && !e.isTaken(B, p, x)) return new A(B, p);
      }
    }
  }
  function E(n) {
    return F(n, t.dTest) ? !1 : n < t.dTest;
  }
  function x(n) {
    return F(n, t.dSep) ? !1 : n < t.dSep;
  }
  function I() {
    for (; ; ) {
      if (s = null, o === D) {
        var n = c();
        if (n) {
          u.push(n), l.occupyCoordinates(n), f = n;
          var i = v(n);
          if (i) return;
        } else
          t.forwardOnly ? o = M : (f = r, o = L);
      }
      if (o === L) {
        var n = T();
        if (n) {
          u.unshift(n), f = n, l.occupyCoordinates(n);
          var i = v(n);
          if (i) return;
        } else
          o = M;
      }
      if (o === M)
        return u.forEach(h), !0;
    }
  }
  function h(n) {
    e.occupyCoordinates(n);
  }
  function c() {
    var n = z(f, t.timeStep, w);
    if (n)
      return y(f, n);
  }
  function T() {
    var n = z(f, t.timeStep, w);
    if (n)
      return n = n.mulScalar(-1), y(f, n);
  }
  function y(n, i) {
    if (s = n.add(i), !e.isOutside(s.x, s.y) && !e.isTaken(s.x, s.y, E) && !l.isTaken(s.x, s.y, g))
      return s;
  }
  function g(n) {
    return n < t.timeStep * 0.9;
  }
  function v(n) {
    var i = !1;
    return t.onPointAdded && (i = t.onPointAdded(n, u[o === D ? u.length - 2 : 1], t, u)), i;
  }
  function w(i) {
    var i = t.vectorField(i, u, o === M);
    if (i && !(Number.isNaN(i.x) || Number.isNaN(i.y))) {
      var d = i.x * i.x + i.y * i.y;
      if (d !== 0)
        return d = Math.sqrt(d), new A(i.x / d, i.y / d);
    }
  }
}
function F(r, e) {
  return Math.abs(r - e) < 1e-4;
}
function H(r) {
  if (!r) throw new Error("Canvas is required");
  var e = r.getContext("2d"), t = r.width, u = r.height;
  return f;
  function f(s, a, l) {
    e.beginPath(), e.strokeStyle = "rgba(0, 0, 0, 0.6)", s = o(s, l.boundingBox), a = o(a, l.boundingBox), e.moveTo(s.x, s.y), e.lineTo(a.x, a.y), e.stroke(), e.closePath();
  }
  function o(s, a) {
    var l = (s.x - a.left) / a.width, m = (s.y - a.top) / a.height;
    return {
      x: l * t,
      y: (1 - m) * u
    };
  }
}
var G = 0, R = 1, C = 2, Q = 3, q = 4;
const j = typeof globalThis < "u" && globalThis.performance && typeof globalThis.performance.now == "function" ? globalThis.performance : { now: () => Date.now() };
function J(r) {
  var e = /* @__PURE__ */ Object.create(null);
  if (!r)
    throw new Error("Configuration is required to compute streamlines");
  r.boundingBox ? (e.boundingBox = {}, Object.assign(e.boundingBox, r.boundingBox)) : (console.warn("No bounding box passed to streamline. Creating default one"), e.boundingBox = { left: -5, top: -5, width: 10, height: 10 }), V(e.boundingBox);
  var t = e.boundingBox;
  if (e.vectorField = r.vectorField, e.onStreamlineAdded = r.onStreamlineAdded, e.onPointAdded = r.onPointAdded, e.forwardOnly = r.forwardOnly, !r.seed)
    e.seed = new A(
      Math.random() * t.width + t.left,
      Math.random() * t.height + t.top
    );
  else if (Array.isArray(r.seed)) {
    var u = r.seed.shift();
    e.seed = new A(u.x, u.y), e.seedArray = r.seed;
  } else
    e.seed = new A(r.seed.x, r.seed.y);
  e.dSep = r.dSep > 0 ? r.dSep : 1 / Math.max(t.width, t.height), e.dTest = r.dTest > 0 ? r.dTest : e.dSep * 0.5;
  var f = U(t, e.dSep);
  e.timeStep = r.timeStep > 0 ? r.timeStep : 0.01, e.stepsPerIteration = r.stepsPerIteration > 0 ? r.stepsPerIteration : 10, e.maxTimePerIteration = r.maxTimePerIteration > 0 ? r.maxTimePerIteration : 1e3;
  var o = e.stepsPerIteration, s, a = G, l = [], m = _(
    e.seed,
    f,
    e
  ), k = !1, E = !1, x;
  return {
    run: h,
    getGrid: I,
    dispose: T
  };
  function I() {
    return f;
  }
  function h() {
    if (!E)
      return E = !0, x = setTimeout(y, 0), new Promise(c);
  }
  function c(d) {
    s = d;
  }
  function T() {
    k = !0, clearTimeout(x);
  }
  function y() {
    if (!k) {
      for (var d = e.maxTimePerIteration, S = j.now(), P = 0; P < o && (a === G && g(), a === R && n(), a === C && w(), a === q && v(), !(j.now() - S > d)); ++P)
        if (a === Q) {
          s(e);
          return;
        }
      x = setTimeout(y, 0);
    }
  }
  function g() {
    var d = m.next();
    d && (i(), a = C);
  }
  function v() {
    var d = l[0], S = d.getNextValidSeed();
    S ? (m = _(
      S,
      f,
      e
    ), a = R) : (l.shift(), a = C);
  }
  function w() {
    l.length === 0 ? a = Q : a = q;
  }
  function n() {
    var d = m.next();
    d && (i(), a = q);
  }
  function i() {
    var d = m.getStreamline();
    d.length > 1 && (l.push(m), e.onStreamlineAdded && e.onStreamlineAdded(d, e));
  }
}
function V(r) {
  var e = "Bounding box {left, top, width, height} is required";
  if (!r) throw new Error(e);
  if (N(r.left, e), N(r.top, e), typeof r.size == "number" && (r.width = r.size, r.height = r.size), N(r.width, e), N(r.height, e), r.width <= 0 || r.height <= 0)
    throw new Error("Bounding box cannot be empty");
}
function N(r, e) {
  if (typeof r != "number" || Number.isNaN(r)) throw new Error(e);
}
export {
  J as default,
  H as renderTo
};
