(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.streamlines = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Computes streamlines of a vector field based on http://web.cs.ucdavis.edu/~ma/SIGGRAPH02/course23/notes/papers/Jobard.pdf
 */
module.exports = computeStreamlines;
module.exports.renderTo = require('./lib/renderTo');

var Vector = require('./lib/Vector');
var createLookupGrid = require('./lib/createLookupGrid');
var createStreamlineIntegrator = require('./lib/streamLineIntegrator');

var STATE_INIT = 0;
var STATE_STREAMLINE = 1;
var STATE_PROCESS_QUEUE = 2;
var STATE_DONE = 3;
var STATE_SEED_STREAMLINE = 4;

function computeStreamlines(protoOptions) {
  var options = Object.create(null);
  if (!protoOptions)
    throw new Error('Configuration is required to compute streamlines');
  if (!protoOptions.boundingBox) {
    console.warn('No bounding box passed to streamline. Creating default one');
    options.boundingBox = { left: -5, top: -5, width: 10, height: 10 };
  } else {
    options.boundingBox = {};
    Object.assign(options.boundingBox, protoOptions.boundingBox);
  }

  normalizeBoundingBox(options.boundingBox);

  var boundingBox = options.boundingBox;
  options.vectorField = protoOptions.vectorField;
  options.onStreamlineAdded = protoOptions.onStreamlineAdded;
  options.onPointAdded = protoOptions.onPointAdded;
  options.forwardOnly = protoOptions.forwardOnly;

  if (!protoOptions.seed) {
    options.seed = new Vector(
      Math.random() * boundingBox.width + boundingBox.left,
      Math.random() * boundingBox.height + boundingBox.top
    );
  } else if (Array.isArray(protoOptions.seed)) {
    var seed = protoOptions.seed.shift();
    options.seed = new Vector(seed.x, seed.y);
    options.seedArray = protoOptions.seed;
  } else {
    options.seed = new Vector(protoOptions.seed.x, protoOptions.seed.y);
  }

  // Separation between streamlines. Naming according to the paper.
  options.dSep =
    protoOptions.dSep > 0
      ? protoOptions.dSep
      : 1 / Math.max(boundingBox.width, boundingBox.height);

  // When should we stop integrating a streamline.
  options.dTest =
    protoOptions.dTest > 0 ? protoOptions.dTest : options.dSep * 0.5;

  // Lookup grid helps to quickly tell if there are points nearby
  var grid = createLookupGrid(boundingBox, options.dSep);

  // Integration time step.
  options.timeStep = protoOptions.timeStep > 0 ? protoOptions.timeStep : 0.01;
  options.stepsPerIteration =
    protoOptions.stepsPerIteration > 0 ? protoOptions.stepsPerIteration : 10;
  options.maxTimePerIteration =
    protoOptions.maxTimePerIteration > 0
      ? protoOptions.maxTimePerIteration
      : 1000;

  var stepsPerIteration = options.stepsPerIteration;
  var resolve;
  var state = STATE_INIT;
  var finishedStreamlineIntegrators = [];
  var streamlineIntegrator = createStreamlineIntegrator(
    options.seed,
    grid,
    options
  );
  var disposed = false;
  var running = false;
  var nextTimeout;
  // It is asynchronous. If this is used in a browser we don't want to freeze the UI thread.
  // On the other hand, if you need this to be sync - we can extend the API. Just let me know.

  return {
    run: run,
    getGrid: getGrid,
    dispose: dispose
  };
  
  function getGrid() {
    return grid;
  }

  function run() {
    if (running) return;
    running = true;
    nextTimeout = setTimeout(nextStep, 0);

    return new Promise(assignResolve);
  }

  function assignResolve(pResolve) {
    resolve = pResolve;
  }

  function dispose() {
    disposed = true;
    clearTimeout(nextTimeout);
  }

  function nextStep() {
    if (disposed) return;
    var maxTimePerIteration = options.maxTimePerIteration;
    var start = window.performance.now();

    for (var i = 0; i < stepsPerIteration; ++i) {
      if (state === STATE_INIT) initProcessing();
      if (state === STATE_STREAMLINE) continueStreamline();
      if (state === STATE_PROCESS_QUEUE) processQueue();
      if (state === STATE_SEED_STREAMLINE) seedStreamline();
      if (window.performance.now() - start > maxTimePerIteration) break;

      if (state === STATE_DONE) {
        resolve(options);
        return;
      }
    }

    nextTimeout = setTimeout(nextStep, 0);
  }

  function initProcessing() {
    var streamLineCompleted = streamlineIntegrator.next();
    if (streamLineCompleted) {
      addStreamLineToQueue();
      state = STATE_PROCESS_QUEUE;
    }
  }

  function seedStreamline() {
    var currentStreamLine = finishedStreamlineIntegrators[0];

    var validCandidate = currentStreamLine.getNextValidSeed();
    if (validCandidate) {
      streamlineIntegrator = createStreamlineIntegrator(
        validCandidate,
        grid,
        options
      );
      state = STATE_STREAMLINE;
    } else {
      finishedStreamlineIntegrators.shift();
      state = STATE_PROCESS_QUEUE;
    }
  }

  function processQueue() {
    if (finishedStreamlineIntegrators.length === 0) {
      state = STATE_DONE;
    } else {
      state = STATE_SEED_STREAMLINE;
    }
  }

  function continueStreamline() {
    var isDone = streamlineIntegrator.next();
    if (isDone) {
      addStreamLineToQueue();
      state = STATE_SEED_STREAMLINE;
    }
  }

  function addStreamLineToQueue() {
    var streamLinePoints = streamlineIntegrator.getStreamline();
    if (streamLinePoints.length > 1) {
      finishedStreamlineIntegrators.push(streamlineIntegrator);
      if (options.onStreamlineAdded)
        options.onStreamlineAdded(streamLinePoints, options);
    }
  }
}

function normalizeBoundingBox(bbox) {
  var requiredBoxMessage =
    'Bounding box {left, top, width, height} is required';
  if (!bbox) throw new Error(requiredBoxMessage);

  assertNumber(bbox.left, requiredBoxMessage);
  assertNumber(bbox.top, requiredBoxMessage);
  if (typeof bbox.size === 'number') {
    bbox.width = bbox.size;
    bbox.height = bbox.size;
  }
  assertNumber(bbox.width, requiredBoxMessage);
  assertNumber(bbox.height, requiredBoxMessage);

  if (bbox.width <= 0 || bbox.height <= 0)
    throw new Error('Bounding box cannot be empty');
}

function assertNumber(x, msg) {
  if (typeof x !== 'number' || Number.isNaN(x)) throw new Error(msg);
}

},{"./lib/Vector":2,"./lib/createLookupGrid":4,"./lib/renderTo":5,"./lib/streamLineIntegrator":7}],2:[function(require,module,exports){
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
},{"./classCheck":3}],3:[function(require,module,exports){
module.exports = function classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
     throw new TypeError("Cannot call a class as a function");
  }
}
},{}],4:[function(require,module,exports){
var classCallCheck = require('./classCheck');

module.exports = createLookupGrid;

var Cell = function () {
  function Cell() {
    classCallCheck(this, Cell);

    this.children = null;
  }

  Cell.prototype.occupy = function occupy(point) {
    if (!this.children) this.children = [];
    this.children.push(point);
  };

  Cell.prototype.isTaken = function isTaken(x, y, checkCallback) {
    if (!this.children) return false;

    for (var i = 0; i < this.children.length; ++i) {
      var p = this.children[i];
      var dx = p.x - x,
          dy = p.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (checkCallback(dist, p)) return true;
    }

    return false;
  };

  Cell.prototype.getMinDistance = function getMinDistance(x, y) {
    let minDistance = Infinity;

    if (!this.children) return minDistance;

    for (var i = 0; i < this.children.length; ++i) {
      var p = this.children[i];
      var dx = p.x - x,
          dy = p.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    return minDistance;
  }

  return Cell;
}();

function createLookupGrid(bbox, dSep) {
  var bboxSize = Math.max(bbox.width, bbox.height);

  var cellsCount = Math.ceil(bboxSize / dSep);

  var cells = new Map();

  var api = {
    occupyCoordinates: occupyCoordinates,
    isTaken: isTaken,
    isOutside: isOutside,
    findNearest: findNearest
  };

  return api;

  function findNearest(x, y) {
    var cx = gridX(x);
    var cy = gridY(y);
    let minDistance = Infinity;

    for (var col = -1; col < 2; ++col) {
      var currentCellX = cx + col;
      if (currentCellX < 0 || currentCellX >= cellsCount) continue;
      
      var cellRow = cells.get(currentCellX);
      if (!cellRow) continue;

      for (var row = -1; row < 2; ++row) {
        var currentCellY = cy + row;
        if (currentCellY < 0 || currentCellY >= cellsCount) continue;

        var cellCol = cellRow.get(currentCellY);
        if(!cellCol) continue;
        let d = cellCol.getMinDistance(x, y);
        if (d < minDistance) minDistance = d;
      }
    }

    return minDistance;
  }

  function isOutside(x, y) {
    return x < bbox.left || x > bbox.left + bbox.width || 
           y < bbox.top || y > bbox.top + bbox.height;
  }

  function occupyCoordinates(point) {
    var x = point.x, y = point.y;
    getCellByCoordinates(x, y).occupy(point);
  }

  function isTaken(x, y, checkCallback) {
    if (!cells) return false;

    var cx = gridX(x);
    var cy = gridY(y);
    for (var col = -1; col < 2; ++col) {
      var currentCellX = cx + col;
      if (currentCellX < 0 || currentCellX >= cellsCount) continue;
      
      var cellRow = cells.get(currentCellX);
      if (!cellRow) continue;

      for (var row = -1; row < 2; ++row) {
        var currentCellY = cy + row;
        if (currentCellY < 0 || currentCellY >= cellsCount) continue;

        var cellCol = cellRow.get(currentCellY);
        if(!cellCol) continue;
        if(cellCol.isTaken(x, y, checkCallback)) return true;
      }
    }

    return false;
  }

  function getCellByCoordinates(x, y) {
    assertInBounds(x, y);

    var rowCoordinate = gridX(x);
    var row = cells.get(rowCoordinate);
    if (!row) {
      row = new Map();
      cells.set(rowCoordinate, row);
    }
    var colCoordinate = gridY(y);
    var cell = row.get(colCoordinate);
    if (!cell) {
      cell = new Cell();
      row.set(colCoordinate, cell)
    }
    return cell;
  }

  function gridX(x) {
    return Math.floor(cellsCount * (x - bbox.left)/bboxSize);
  }

  function gridY(y) {
    return Math.floor(cellsCount * (y - bbox.top)/bboxSize);
  }

  function assertInBounds(x, y) {
    if (bbox.left > x || bbox.left + bboxSize < x ) {
      throw new Error('x is out of bounds');
    }
    if (bbox.top > y || bbox.top + bboxSize < y ) {
      throw new Error('y is out of bounds');
    }
  }
}
},{"./classCheck":3}],5:[function(require,module,exports){
module.exports = renderTo;

function renderTo(canvas) {
  if (!canvas) throw new Error('Canvas is required');

  var ctx = canvas.getContext('2d');
  var width = canvas.width;
  var height = canvas.height;

  return onPointAdded;

  function onPointAdded(a, b, config) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    a = transform(a, config.boundingBox);
    b = transform(b, config.boundingBox);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.closePath();
  }

  function transform(pt, boundingBox) {
    var tx = (pt.x - boundingBox.left)/boundingBox.width;
    var ty = (pt.y - boundingBox.top)/boundingBox.height;
    return {
      x: tx * width,
      y: (1 - ty) * height
    }
  }
}
},{}],6:[function(require,module,exports){
/**
 * Performs Runge-Kutta 4th order integration.
 */
module.exports = rk4;

function rk4(point, timeStep, getVelocity) {
  var k1 = getVelocity(point);
  if (!k1) return;
  var k2 = getVelocity(point.add(k1.mulScalar(timeStep * 0.5)));
  if (!k2) return;
  var k3 = getVelocity(point.add(k2.mulScalar(timeStep * 0.5)));
  if (!k3) return;
  var k4 = getVelocity(point.add(k3.mulScalar(timeStep)));
  if (!k4) return;

  var res = k1.mulScalar(timeStep / 6).add(k2.mulScalar(timeStep/3)).add(k3.mulScalar(timeStep/3)).add(k4.mulScalar(timeStep/6));
  return res;
}
},{}],7:[function(require,module,exports){
var Vector = require('./Vector');
var rk4 = require('./rk4');
var createLookupGrid = require('./createLookupGrid');

var FORWARD = 1;
var BACKWARD = 2;
var DONE = 3;

module.exports = createStreamlineIntegrator;

function createStreamlineIntegrator(start, grid, config) {
  var points = [start];
  var pos = start;
  var state = FORWARD;
  var candidate = null;
  var lastCheckedSeed = -1;
  var ownGrid = createLookupGrid(config.boundingBox, config.timeStep * 0.9);

  return {
    start: start,
    next: next,
    getStreamline: getStreamline,
    getNextValidSeed: getNextValidSeed
  }

  function getStreamline() {
    return points;
  }

  function getNextValidSeed() {
    while (lastCheckedSeed < points.length - 1) {
      lastCheckedSeed += 1;

      var p = points[lastCheckedSeed];
      var v = normalizedVectorField(p);
      if (!v) continue;
      // Check one normal. We just set c = p + n, where n is orthogonal to v.
      // Since v is unit vector we can multiply it by scaler (config.dSep) to get to the
      // right point. It is also easy to find normal in 2d: normal to (x, y) is just (-y, x).
      // You can get it by applying 2d rotation matrix.)
      var cx = p.x - v.y * config.dSep;
      var cy = p.y + v.x * config.dSep;

      if (Array.isArray(config.seedArray) && config.seedArray.length > 0) {
        var seed = config.seedArray.shift();
        cx = seed.x;
        cy = seed.y;
      }

      if (!grid.isOutside(cx, cy) && !grid.isTaken(cx, cy, checkDSep)) {
        // this will let us check the other side. When we get back
        // into this method, the point `cx, cy` will be taken (by construction of another streamline)
        // And we will throw through to the next orthogonal check.
        lastCheckedSeed -= 1; 
        return new Vector(cx, cy);
      }

      // Check orthogonal coordinates on the other side (o = p - n).
      var ox = p.x + v.y * config.dSep;
      var oy = p.y - v.x * config.dSep;
      if (!grid.isOutside(ox, oy) && !grid.isTaken(ox, oy, checkDSep)) return new Vector(ox, oy);
    }
  }

  function checkDTest(distanceToCandidate) {
    if (isSame(distanceToCandidate, config.dTest)) return false;
    return distanceToCandidate < config.dTest;
  }

  function checkDSep(distanceToCandidate) {
    if (isSame(distanceToCandidate, config.dSep)) return false;

    return distanceToCandidate < config.dSep;
  }

  function next() {
    while(true) {
      candidate = null;
      if (state === FORWARD) {
        var point = growForward();
        if (point) {
          points.push(point);
          ownGrid.occupyCoordinates(point);
          pos = point;
          var shouldPause = notifyPointAdded(point);
          if (shouldPause) return;
        } else {
          // Reset position to start, and grow backwards:
          if (config.forwardOnly)  {
            state = DONE;
          } else {
            pos = start;
            state = BACKWARD;
          }
        }
      } 
      if (state === BACKWARD) {
        var point = growBackward();
        if (point) {
          points.unshift(point);
          pos = point;
          ownGrid.occupyCoordinates(point);

          var shouldPause = notifyPointAdded(point);
          if (shouldPause) return;
        } else {
          state = DONE;
        }
      }

      if (state === DONE) {
        points.forEach(occupyPointInGrid);
        return true;
      }
    }
  }

  function occupyPointInGrid(p) {
    grid.occupyCoordinates(p);
  }

  function growForward() {
    var velocity = rk4(pos, config.timeStep, normalizedVectorField);
    if (!velocity) return; // Hit the singularity.

    return growByVelocity(pos, velocity);
  }

  function growBackward() {
    var velocity = rk4(pos, config.timeStep, normalizedVectorField);
    if (!velocity) return; // Singularity
    velocity = velocity.mulScalar(-1);

    return growByVelocity(pos, velocity);
  }

  function growByVelocity(pos, velocity) {
    candidate = pos.add(velocity);
    if (grid.isOutside(candidate.x, candidate.y)) return;
    if (grid.isTaken(candidate.x, candidate.y, checkDTest)) return;

    // did we hit any of our points?
    if(ownGrid.isTaken(candidate.x, candidate.y, timeStepCheck)) return;
    // for (var i = 0; i < points.length; ++i) {
    //   if (points[i].distanceTo(candidate) < config.timeStep * 0.9) return;
    // }

    return candidate;
  }

  function timeStepCheck(distanceToCandidate) {
    return distanceToCandidate < config.timeStep * 0.9;
  }

  function notifyPointAdded(point) {
    var shouldPause = false;
    if (config.onPointAdded) {
      shouldPause = config.onPointAdded(point, points[state === FORWARD ? points.length - 2 : 1], config, points);
    } 

    return shouldPause;
  }

  function normalizedVectorField(p) {
    var p = config.vectorField(p, points, state === DONE);
    if (!p) return; // Assume singularity
    if (Number.isNaN(p.x) || Number.isNaN(p.y)) return; // Not defined. e.g. Math.log(-1);

    var l = p.x * p.x + p.y * p.y;

    if (l === 0) return; // the same, singularity
    l = Math.sqrt(l);

    // We need normalized field.
    return new Vector(p.x/l, p.y/l);
  }
}

function isSame(a, b) {
  // to avoid floating point error
  return Math.abs(a - b) < 1e-4;
}
},{"./Vector":2,"./createLookupGrid":4,"./rk4":6}]},{},[1])(1)
});