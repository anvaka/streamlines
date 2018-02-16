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
  if (!protoOptions) throw new Error('Configuration is required to compute streamlines');
  if (!protoOptions.boundingBox) {
    console.warn('No bounding box passed to streamline. Creating default one');
    options.boundingBox = {left: -5, top: -5, width: 10, height: 10};
  } else {
    options.boundingBox = {}
    Object.assign(options.boundingBox, protoOptions.boundingBox);
  }

  normalizeBoundingBox(options.boundingBox);

  var boundingBox = options.boundingBox
  options.vectorField = protoOptions.vectorField;
  options.onStreamlineAdded = protoOptions.onStreamlineAdded;
  options.onPointAdded = protoOptions.onPointAdded;

  if (!protoOptions.seed) {
    options.seed = new Vector(
      Math.random() * boundingBox.width + boundingBox.left,
      Math.random() * boundingBox.height + boundingBox.top
    );
  } else {
    options.seed = new Vector(protoOptions.seed.x, protoOptions.seed.y);
  }

  // Separation between streamlines. Naming according to the paper.
  options.dSep = protoOptions.dSep > 0 ? protoOptions.dSep : 1./Math.max(boundingBox.width, boundingBox.height);

  // When should we stop integrating a streamline.
  options.dTest = protoOptions.dTest > 0 ? protoOptions.dTest : options.dSep * 0.5;

  // Lookup grid helps to quickly tell if there are points nearby
  var grid = createLookupGrid(boundingBox, options.dSep);

  // Integration time step.
  options.timeStep = protoOptions.timeStep > 0 ? protoOptions.timeStep : 0.01;
  options.stepsPerIteration = protoOptions.stepsPerIteration > 0 ? protoOptions.stepsPerIteration : 10;

  var stepsPerIteration = options.stepsPerIteration;
  var resolve;
  var state = STATE_INIT;
  var finishedStreamlineIntegrators = [];
  var streamlineIntegrator = createStreamlineIntegrator(options.seed, grid, options);
  var disposed = false;
  var running = false;
  var nextTimeout;
  // It is asynchronous. If this is used in a browser we don't want to freeze the UI thread.
  // On the other hand, if you need this to be sync - we can extend the API. Just let me know.

  return {
    run: run,
    dispose: dispose
  } 

  function run() {
    if (running) return;
    running = true;
    nextTimeout = setTimeout(nextStep, 0);

    return new Promise(assignResolve)
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

    for (var i = 0; i < stepsPerIteration; ++i) {
      if (state === STATE_INIT) initProcessing();
      if (state === STATE_STREAMLINE) continueStreamline();
      if (state === STATE_PROCESS_QUEUE) processQueue();
      if (state === STATE_SEED_STREAMLINE) seedStreamline();

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
      if (options.onStreamlineAdded) options.onStreamlineAdded(streamLinePoints, options);
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
  if (typeof x !== 'number' || Number.isNaN(x)) throw new Error(msg);
}