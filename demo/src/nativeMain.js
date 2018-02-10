var appState = require('./lib/appState');

var canvas = document.getElementById('scene-canvas');
// Canvas may not be available in test run
if (canvas) appState.init(canvas);

// Tell webpack to split bundle, and download settings UI later.
require.ensure('@/main.js', () => {
  // Settings UI is ready, initialize vue.js application
  require('@/main.js');
});