import appState from './lib/appState.js';

const canvas = document.getElementById('scene-canvas');
if (canvas) appState.init(canvas);

// Lazy load UI after initial canvas init (optional, but keep behavior similar)
import('./main.js');