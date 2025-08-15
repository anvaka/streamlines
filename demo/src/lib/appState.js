// Support both direct source (local dev) and package import styles without top-level await.
// Vite will pre-bundle CJS and expose .default via interop when using the following import.
import * as streamlinesNS from '@anvaka/streamlines';
import bus from '../bus.js';
// Make fieldCode reactive so components (e.g. CodeEditor) see code updates (e.g. Randomize)
// without needing manual event propagation.
import { reactive } from 'vue';
const streamline = streamlinesNS.default || streamlinesNS;

var defaultCode = `function getVelocity(p) {
  var l = Math.sqrt(p.x * p.x + p.y * p.y);
  return {
    x: Math.cos(l),
    y: Math.log(Math.abs(p.x))
  };
}`

var boundingBox = {left: -5, top: -5, width: 10, height: 10}
// Reactive model passed into <code-editor>. Wrapping in reactive fixes issue where
// external updates (Randomize) didn't propagate to CodeMirror watcher.
var fieldCode = reactive({
  code: defaultCode,
  error: null,
  isImmediate: false,
  setCode(newCode, immediate) {
    var newVectorField = compileVectorFieldFunction(newCode);
    if (!newVectorField) return; // error
    fieldCode.error = null;
    fieldCode.code = newCode;
    streamLineGeneratorOptions.vectorField = newVectorField;
    if (immediate) {
      redraw();
    } else if (!fieldCode.immediate) {
      dirty();
    }
    fieldCode.immediate = immediate;
  }
})

var seedPoint = selectSeedPoint();
var streamLineGeneratorOptions = {
  vectorField: null,
  seed: seedPoint,
  boundingBox,
  stepsPerIteration: 15,
  timeStep: 0.01,
  dSep: 0.1,
  dTest: 0.005,
  onPointAdded,
};

var lineColor = 'rgba(255, 255, 255, 0.6)';
var fillColor = 'rgba(27, 41, 74, 1.0)';

window.addEventListener('resize', dirty);

const appState = {
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

  getLineColor() { return lineColor },
  setLineColor(r, g, b, a) { 
    lineColor = `rgba(${r}, ${g}, ${b}, ${a})`; 
    dirty();
  },
  getFillColor() { return fillColor; },
  setFillColor(r, g, b, a) {
    fillColor = `rgba(${r}, ${g}, ${b}, ${a})`; 
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
  collapsed: true,
  // Make isDirty reactive so the Redraw button animation can stop immediately after redraw()
  isDirty: false,
  // Also predefine dWarning so warning visibility is reactive
  dWarning: ''
  },
  moveBoundingBox,
  bounds: readBoundsFromBBox(boundingBox),
}

export default appState

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
  bus.fire('dirty-changed', false);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  render();
}

function dirty() {
  appState.settingsPanel.isDirty = true;
  bus.fire('dirty-changed', true);
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
  ctx.strokeStyle = lineColor;
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
  // var ar = width/height;
  //tx /= ar;
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