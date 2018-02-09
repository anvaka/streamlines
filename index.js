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