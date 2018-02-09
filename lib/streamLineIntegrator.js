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