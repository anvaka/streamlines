var isSmallScreen = require('./isSmallScreen.js');
var streamline = require('../../../index.js');

var defaultCode = `function getVelocity(p) {
  var l = Math.sqrt(p.x * p.x + p.y * p.y);
  return {
    x: Math.cos(l),
    y: Math.log(Math.abs(p.x))
  };
}`

var boundingBox = {left: -5, top: -2.5, width: 10, height: 5}
var fieldCode = {
  code: defaultCode,
  error: null,
  setCode(newCode) {
    var newVectorField = compileVectorFieldFunction(newCode);
    if (!newVectorField) return; // error
    fieldCode.error = null;
    fieldCode.code = newCode;
    streamLineGeneratorOptions.vectorField = newVectorField;
    dirty();
  }
}

var streamLineGeneratorOptions = {
  vectorField: null,
  seed: seedPoint,
  boundingBox,
  stepsPerIteration: 30,
  timeStep: 0.01,
  dSep: 0.25,
  dTest: 0.01,
  onPointAdded,
};

window.addEventListener('resize', dirty);

var appState = {
  isDirty: false,
  init,
  fieldCode,
  redraw,

  getIntegrationProximity() { return streamLineGeneratorOptions.dTest; },
  setIntegrationProximity(newValue) { 
    var ratio = getNumber(newValue, streamLineGeneratorOptions.dTest);
    if (ratio <= 0) ratio = 0.001;
    if (ratio > 1) ratio = 1;
    streamLineGeneratorOptions.dTest = newValue
    validateDSepTest();
    dirty();
  },

  getFieldDensity() { return streamLineGeneratorOptions.dSep; },
  setFieldDensity(newValue) { 
    streamLineGeneratorOptions.dSep = getNumber(newValue, streamLineGeneratorOptions.dSep);
    dirty();
  },

  getStepsPerIteration() { return streamLineGeneratorOptions.stepsPerIteration; },
  setStepsPerIteration(newValue) { 
    streamLineGeneratorOptions.stepsPerIteration = getNumber(newValue, streamLineGeneratorOptions.stepsPerIteration);
    dirty();
  },

  getIntegrationTimeStep() { return streamLineGeneratorOptions.timeStep; },
  setIntegrationTimeStep(newValue) { 
    streamLineGeneratorOptions.timeStep = getNumber(newValue, streamLineGeneratorOptions.timeStep);
    dirty();
  },
  settingsPanel: {
    collapsed: isSmallScreen(),
  },
  moveBoundingBox,
  bounds: readBoundsFromBBox(boundingBox),
}

var seedPoint = selectSeedPoint();


module.exports = appState

var lastStreamLineRenderer;
var canvas, ctx, width, height;

function init(c) {
  canvas = c;
  ctx = canvas.getContext('2d');
  streamLineGeneratorOptions.vectorField = compileVectorFieldFunction(defaultCode);
  redraw();
}

function readBoundsFromBBox(bbox) {
  return {
    minX: bbox.left,
    minY: bbox.top,
    maxX: bbox.left + bbox.width,
    maxY: bbox.top + bbox.height,
  }
}

function validateDSepTest() {
  if (streamLineGeneratorOptions.dTest >= streamLineGeneratorOptions.dSep) {
    appState.settingsPanel.dWarning = 'Stop distance should be smaller than line distance';
  } else {
    appState.settingsPanel.dWarning = '';
  }
}

function selectSeedPoint() {
  return {
    x: boundingBox.left + Math.random() * boundingBox.width,
    y: boundingBox.top + Math.random() * boundingBox.height
  }
}
function moveBoundingBox(bounds) {
  var newLeft = getNumber(bounds.minX, boundingBox.left);
  var newTop = getNumber(bounds.minY, boundingBox.top);

  var newRight = getNumber(bounds.maxX, newLeft + boundingBox.width);
  var newBottom = getNumber(bounds.maxY, newTop + boundingBox.height);

  boundingBox.left = newLeft;
  boundingBox.top = newTop;
  boundingBox.width = newRight - newLeft;
  boundingBox.height =  Math.abs(newTop - newBottom);
  dirty();
}

function getNumber(str, defaultValue) {
  var parsed = Number.parseFloat(str);
  if (Number.isNaN(parsed)) return defaultValue;
  return parsed;
}

function redraw() {
  appState.settingsPanel.isDirty = false;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  render();
}

function dirty() {
  appState.settingsPanel.isDirty = true;
}

function render() {
  if (lastStreamLineRenderer) {
    lastStreamLineRenderer.dispose();
    lastStreamLineRenderer = null;
  }

  lastStreamLineRenderer = streamline(streamLineGeneratorOptions)
  lastStreamLineRenderer.run();
}

function onPointAdded(a, b) {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  a = transform(a);
  b = transform(b);
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.closePath();
  return true;
}

function transform(pt) {
  var tx = (pt.x - boundingBox.left)/boundingBox.width;
  var ty = (pt.y - boundingBox.top)/boundingBox.height;
  return {
    x: tx * width,
    y: (1 - ty) * height
  }
}

function compileVectorFieldFunction(code) {
  try {
    var creator = new Function(code + '\nreturn getVelocity;');
    var getVelocity = creator();
    getVelocity(seedPoint); // just a test.
    return getVelocity;
  } catch (e) {
    fieldCode.error = e.message;
    return null;
  }
}