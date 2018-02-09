(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.streamline = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Computes streamlines of a vector field based on http://web.cs.ucdavis.edu/~ma/SIGGRAPH02/course23/notes/papers/Jobard.pdf
 */
module.exports = computeStreamlines;

var Vector = require('./lib/Vector');
var createLookupGrid = require('./lib/createLookupGrid');
var createStreamlineIntegrator = require('./lib/streamLineIntegrator');

var STATE_INIT = 0;
var STATE_STREAMLINE = 1;
var STATE_PROCESS_QUEUE = 2;
var STATE_DONE = 3;
var STATE_SEED_STREAMLINE = 4;

function computeStreamlines(options) {
  if (!options) throw new Error('Configuration is required to compute streamlines');
  normalizeBoundingBox(options.boundingBox);

  if (!options.seed) {
    options.seed = new Vector(
      Math.random() * options.boundingBox.width + options.boundingBox.left,
      Math.random() * options.boundingBox.height + options.boundingBox.top
    );
  } else {
    // This is not very polite to replace props for the consumers.
    options.seed = new Vector(options.seed.x, options.seed.y);
  }

  var boundingBox = options.boundingBox

  // Separation between streamlines. Naming according to the paper.
  if (!(options.dSep > 0)) options.dSep = 1./Math.max(boundingBox.width, boundingBox.height);

  // When should we stop integrating a streamline.
  if (!(options.dTest > 0)) options.dTest = options.dSep * 0.5;

  // Lookup grid helps to quickly tell if there are points nearby
  var grid = createLookupGrid(boundingBox, options.dSep);

  // Integration time step.
  if (!(options.timeStep > 0)) options.timeStep = 0.01;

  var stepsPerIteration = options.stepsPerIteration || 10;
  var resolve;
  var state = STATE_INIT;
  var finishedStreamlineIntegrators = [];
  var streamlineIntegrator = createStreamlineIntegrator(options.seed, grid, options);
  // It is asynchronous. If this is used in a browser we don't want to freeze the UI thread.
  // On the other hand, if you need this to be sync - we can extend the API. Just let me know.
  setTimeout(nextStep, 0);

  return new Promise((pResolve) => {
    resolve = pResolve;
  })

  function nextStep() {
    for (var i = 0; i < stepsPerIteration; ++i) {
      if (state === STATE_INIT) initProcessing();
      if (state === STATE_STREAMLINE) continueStreamline();
      if (state === STATE_PROCESS_QUEUE) processQueue();
      if (state === STATE_SEED_STREAMLINE) seedStreamline();

      if (state === STATE_DONE) {
        resolve(finishedStreamlineIntegrators.map(s => s.getStreamline()));
        return;
      }
    }

    setTimeout(nextStep, 0);
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
      streamlineIntegrator = createStreamlineIntegrator(validCandidate, grid, options);
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
      if (options.onStreamlineAdded) options.onStreamlineAdded(streamLinePoints);
    }
  }
}

function normalizeBoundingBox(bbox) {
  var requiredBoxMessage = 'Bounding box {left, top, width, height} is required';
  if (!bbox) throw new Error(requiredBoxMessage);

  assertNumber(bbox.left, requiredBoxMessage);
  assertNumber(bbox.top, requiredBoxMessage);
  if (typeof bbox.size === 'number') {
    bbox.width = bbox.size;
    bbox.height = bbox.size;
  }
  assertNumber(bbox.width, requiredBoxMessage);
  assertNumber(bbox.height, requiredBoxMessage);

  if (bbox.width <= 0 || bbox.height <= 0) throw new Error('Bounding box cannot be empty');
}

function assertNumber(x, msg) {
  if (typeof x !== 'number') throw new Error(msg);
}
},{"./lib/Vector":2,"./lib/createLookupGrid":3,"./lib/streamLineIntegrator":5}],2:[function(require,module,exports){
class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  add(other) {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  mulScalar(scalar) {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    var l = this.length();
    this.x /= l;
    this.y /= l;
  }

  distanceTo(other) {
    var dx = other.x - this.x;
    var dy = other.y - this.y;

    return Math.sqrt(dx * dx + dy * dy);
  }
}

module.exports = Vector;
},{}],3:[function(require,module,exports){
module.exports = createLookupGrid;

class Cell {
  constructor() {
    this.children = null;
  }

  occupy(point) {
    if (!this.children) this.children = [];
    this.children.push(point);
  }

  isTaken(x, y, checkCallback) {
    if (!this.children) return false;

    for(var i = 0; i < this.children.length; ++i) {
      var p = this.children[i];
      var dx = p.x - x, dy = p.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (checkCallback(dist, p)) return true;
    }

    return false;
  }
}

function createLookupGrid(bbox, dSep) {
  var bboxSize = Math.max(bbox.width, bbox.height);

  var cellsCount = Math.ceil(bboxSize / dSep);

  var cells = [];

  var api = {
    occupyCoordinates,
    isTaken,
    isOutside
  };

  return api;

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
      
      var cellRow = cells[currentCellX];
      if (!cellRow) continue;

      for (var row = -1; row < 2; ++row) {
        var currentCellY = cy + row;
        if (currentCellY < 0 || currentCellY >= cellsCount) continue;

        var cellCol = cellRow[currentCellY];
        if(!cellCol) continue;
        if(cellCol.isTaken(x, y, checkCallback)) return true;
      }
    }

    return false;
  }

  function getCellByCoordinates(x, y) {
    assertInBounds(x, y);

    var rowCoordinate = gridX(x);
    var row = cells[rowCoordinate];
    if (!row) {
      row = cells[rowCoordinate] = [];
    }
    var colCoordinate = gridY(y);
    var cell = row[colCoordinate];
    if (!cell) {
      cell = row[colCoordinate] = new Cell();
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
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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
    next: next,
    getStreamline: getStreamline,
    getNextValidSeed
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
      // Check orthogonal coordinates
      var cx = p.x - v.y * config.dSep;
      var cy = p.y + v.x * config.dSep;

      if (!grid.isOutside(cx, cy) && !grid.isTaken(cx, cy, checkDSep)) return new Vector(cx, cy);

      var nx = p.x + v.y * config.dSep;
      var ny = p.y - v.x * config.dSep;
      if (!grid.isOutside(nx, ny) && !grid.isTaken(nx, ny, checkDSep)) return new Vector(nx, ny);
    }
  }

  function checkDTest(distanceToCandidate) {
    return distanceToCandidate < config.dTest;
  }

  function checkDSep(distanceToCandidate) {
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
          pos = start;
          state = BACKWARD;
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
        points.forEach(p => {
          grid.occupyCoordinates(p);
        });
        return true;
      }
    }
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
      shouldPause = config.onPointAdded(point, points[state === FORWARD ? points.length - 2 : 1]);
    } 

    return shouldPause;
  }

  function normalizedVectorField(p) {
    var p = config.vectorField(p);
    if (!p) return; // Assume singularity
    if (Number.isNaN(p.x) || Number.isNaN(p.y)) return; // Not defined. e.g. Math.log(-1);

    var l = p.x * p.x + p.y * p.y;

    if (l === 0) return; // the same, singularity
    l = Math.sqrt(l);

    // We need normalized field.
    return new Vector(p.x/l, p.y/l);
  }
}
},{"./Vector":2,"./createLookupGrid":3,"./rk4":4}]},{},[1])(1)
});