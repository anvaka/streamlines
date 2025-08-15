<template>
  <div id="app">
    <div class='controls-container'>
      <div class='controls'>
        <a href='#' @click.prevent='draw' :class='{dirty: isDirty}'>Redraw</a>
        <a href='#' @click.prevent='toggleSettings' class='action'>{{(settingsPanel.collapsed ? "Edit..." : "Close Editor")}}</a>
        <a href='#' @click.prevent='generateNewFunction'>Randomize</a>
      </div>
      <div class='settings' v-show='!settingsPanel.collapsed'>
        <div class='block'>
          <div class='title'>Vector Field <a class='help-title' :class='{"syntax-visible": syntaxHelpVisible}' href='#' @click.prevent='syntaxHelpVisible = !syntaxHelpVisible' title='click to learn more about syntax'>syntax help</a></div>
          <div class='help' v-if='syntaxHelpVisible'>
            <p>Vector field is defined as a plain javascript function. It takes `p` - 
              current point as an input, and should return an object with two properties,
              that denote `x, y` movement.
            </p>
            <a href="#" @click.prevent='syntaxHelpVisible = false' class='close'>Close help</a>
          </div>
          <code-editor :model='fieldCode' ></code-editor>
        </div>

        <div class='block'>
          <div class='title'>Settings</div>
          <div class='row'>
            <div class='col'>Line distance</div>
            <div class='col'><input type='number' :step='densityDelta' v-model='density' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ></div>
            <help-icon @show='densityHelp = !densityHelp' :class='{open: densityHelp}'></help-icon>
          </div>
          <div class='row help' v-if='densityHelp'>
            <div>
              <p>Line distance governs how far new streamline should be created from all existing streamlines.</p>
            </div>
          </div>
          <div class='row error' v-if='settingsPanel.dWarning'>
            {{settingsPanel.dWarning}}
          </div>
          <div class='row'>
            <div class='col'>Stop distance</div>
            <div class='col'><input type='number' :step='proximityDelta' v-model='proximity' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ></div>
            <help-icon @show='proximityHelp = !proximityHelp' :class='{open: proximityHelp}'></help-icon>
          </div>
          <div class='row help' v-if='proximityHelp'>
            <div>
              <p>When new streamline is started we need a stopping criteria. Stop ratio is such criteria.
                Based on the line distance it measures when streamline needs to stop.
                </p>
            </div>
          </div>
          <div class='row'>
            <div class='col'>Integration time step</div>
            <div class='col'><input type='number' :step='integrationStepDelta' v-model='timeStep' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ></div>
            <help-icon @show='integrationStepHelp = !integrationStepHelp' :class='{open: integrationStepHelp}'></help-icon>
          </div>
          <div class='row help' v-if='integrationStepHelp'>
            <div>
              <p>Integration time step defines how fast each curve should be integrated</p>
              <ul>
                <li>Increasing this value makes animation complete faster at risk of some curves missing their turns</li>
                <li>Making this value smaller makes individual pixel placement more accurate</li>
              </ul>
            </div>
          </div>
          <div class='row'>
            <div class='col'>Drawing speed</div>
            <div class='col'><input type='number' :step='stepsPerIterationDelta' v-model='stepsPerIteration' @keyup.enter='onSubmit' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ></div>
            <help-icon @show='stepsPerIterationHelp = !stepsPerIterationHelp' :class='{open: stepsPerIterationHelp}'></help-icon>
          </div>
          <div class='row help' v-if='stepsPerIterationHelp'>
            <div>
              <p>Streamlines are rendered asynchronously in small steps.</p>
              <ul>
                <li>Increasing this value makes animation complete faster. Setting it too high can freeze the browser</li>
                <li>Making this value smaller makes individual pixel placement more prominent, creates effect of mystery.</li>
              </ul>
            </div>
          </div>
          <div class='row'>
            <div class='col'>Line Color</div>
            <div class="col">
              <color-picker :color='lineColor' @changed='updateLineColor'></color-picker>
            </div>
          </div>
          <div class='row'>
            <div class='col'>Background color</div>
            <div class="col">
              <color-picker :color='fillColor' @changed='updateFillColor'></color-picker>
            </div>
          </div>
          <div class='bounding-box'>
            <div class='col title'>bounds</div>
            <div class='row'>
              <div class='col  center'><input type='number' v-model.lazy='bounds.maxY' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
            </div>
            <div class='row'>
              <div class='col min-x'><input type='number' v-model.lazy='bounds.minX' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
              <a class='col reset' href='#' @click.prevent='goToOrigin' title='navigate to point (0,0)'>go to origin</a>
              <div class='col max-x'><input type='number' v-model.lazy='bounds.maxX' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
            </div>
            <div class='row center'>
              <div class='col center'><input type='number' v-model.lazy='bounds.minY' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <a href="https://github.com/anvaka/streamlines" class='about-link'>Source code</a>
  </div>
</template>

<script>
import CodeEditor from './components/CodeEditor.vue';
import ColorPicker from './components/ColorPicker.vue';
import HelpIcon from './components/Icon.vue';

import isSmallScreen from './lib/isSmallScreen.js';
import generateFunction from './lib/generate-function.js';
import appState from './lib/appState.js';
import bus from './bus.js';

export default {
  name: 'App',
  components: {
    CodeEditor,
    ColorPicker,
    HelpIcon
  },
  data() {
    return {
      syntaxHelpVisible: false,
      settingsPanel: appState.settingsPanel,
      fieldCode: appState.fieldCode,
      bounds: appState.bounds,

      lineColor: appState.getLineColor(),
      fillColor: appState.getFillColor(),

      timeStep: appState.getIntegrationTimeStep(),
      integrationStepHelp: false,

      stepsPerIteration: appState.getStepsPerIteration(),
      stepsPerIterationHelp : false,

      density: appState.getFieldDensity(),
      densityHelp: false,

      proximity: appState.getIntegrationProximity(),
  proximityHelp: false,
  isDirty: appState.settingsPanel.isDirty
    }
  },
  computed: {
    integrationStepDelta() { return exponentialStep(this.timeStep); },
    stepsPerIterationDelta() { return exponentialStep(this.stepsPerIteration); },
    densityDelta() { return exponentialStep(this.density); },
    proximityDelta() { return exponentialStep(this.proximity); }
  },
  watch: {
    timeStep(newValue) { appState.setIntegrationTimeStep(newValue); },
    stepsPerIteration(newValue) { appState.setStepsPerIteration(newValue); },
    density(newValue) { appState.setFieldDensity(newValue); },
    proximity(newValue) { appState.setIntegrationProximity(newValue); },
    'bounds.minX': function() { this.moveBoundingBox(); },
    'bounds.maxX': function() { this.moveBoundingBox(); },
    'bounds.minY': function() { this.moveBoundingBox(); },
    'bounds.maxX': function() { this.moveBoundingBox(); }
  },
  methods: {
    draw() { 
      appState.redraw(); 
      // ensure immediate UI update in case event loop delays bus event
      this.isDirty = false; 
    },
    updateLineColor(c) {
       appState.setLineColor(c.r, c.g, c.b, c.a); 
       this.lineColor = appState.getLineColor();
    },
    updateFillColor(c) {
       appState.setFillColor(c.r, c.g, c.b, c.a); 
       this.fillColor = appState.getFillColor();
    },
    toggleSettings() {
      this.settingsPanel.collapsed = !this.settingsPanel.collapsed;
      bus.fire('settings-collapsed', this.settingsPanel.collapsed);
    },
    generateNewFunction() {
       var code = generateFunction();
       appState.fieldCode.setCode(code, true);
    },
    moveBoundingBox() {
      appState.moveBoundingBox(this.bounds);
    },
    onSubmit() {
      if (isSmallScreen()) {
        appState.settingsPanel.collapsed = true;
      }
      appState.redraw();
    },
    goToOrigin() {
      this.bounds = {
        minX: -5,
        minY: -5,
        maxX: 5,
        maxY: 5
      }
    }
  }
  ,created() {
    this._onDirtyChanged = (v) => { this.isDirty = v; };
    bus.on('dirty-changed', this._onDirtyChanged);
  }
  ,beforeUnmount() {
    if (this._onDirtyChanged) bus.off('dirty-changed', this._onDirtyChanged);
  }
}

function exponentialStep(value) {
  var dt = Math.pow(10, Math.floor(Math.log10(value)));
  if (value - dt === 0) {
    // This is odd case when you are increasing number, but otherwise it's a good adjustment.
    return dt/10;
  }
  return dt;
}
</script>

<style lang='stylus'>
@import './shared.styl';

* {
  box-sizing: border-box;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
}
a {
  color: primary-text;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.row.error {
  background-color: severe-error-background;
  color: primary-text;
}
.controls-container {
  z-index: 1;
  position: absolute;
  max-height: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  width: 440px;

  border: 1px solid secondary-border;
  border-left: none;
  border-top: none;
  overflow: hidden;
  flex-direction: column;
  display: flex;
}
a {
  text-decoration: none;
}
.settings {
  flex: 1;
  color: secondary-text;
  left: 0;
  overflow-y: auto;
  border-top: 1px solid secondary-border;
  background: window-background;
  width: 100%;
  padding: 7px 7px 7px 7px;

  a.help-title {
    float: right;
    font-size: 12px;
    font-style: italic;
    color: #267fcd;
    height: 30px;
    margin: -5px;
    padding: 7px;
  }
  a.syntax-visible {
    background: help-background;
    color: white;
    font-style: normal;
  }
}

.settings.collapsed {
  display: none;
}

.title {
  margin-bottom: 7px;
  color: primary-text;
  font-size: 18px;
}

.row {
  display: flex;
  flex-direction: row;
}
.col {
  flex: 1;
}
.center {
  justify-content: center;
}
.block {
  .col {
    align-items: center;
    display: flex;
  }
  // .row {
  //   margin-top: 4px;
  // }
  select {
    margin-left: 14px;
  }

  input[type='text'],
  input[type='number'] {
    background: transparent;
    color: primary-text;
    border: 1px solid transparent;
    padding: 7px;
    font-size: 16px;
    width: 100%;
    margin-left: 7px;
    &:focus {
      outline-offset: 0;
      outline: none;
      border: 1px dashed;
      background: #13294f;
    }
    &:invalid {
      box-shadow:none;
    }
  }
}
.reset {
  text-decoration: none;
  color: white;
  display: flex;
  justify-content: center;
}

.bounding-box {
  position: relative;
  .title {
    position: absolute;
    bottom: 0;
    font-size: 12px;
    left: 0;
    color: ternary-text;
  }
  .reset {
    font-size: 16px;
  }

  input[type='number'] {
    width: 100px;
    margin: 0;
    font-size: 12px;
    text-align: center;
    color: secondary-text;
  }
  input:invalid {
      box-shadow: none;
  }
  .max-x {
    justify-content: flex-end;
  }
}
a.about-link {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 42px;
  padding-left: 7px;
  display: flex;
  align-items: center;
}

@keyframes blink {
    from { background: rgba(10, 25, 54, 1); }
    to { background: rgba(24, 63, 154, 1); }
}
/* Subtle pulse for the dirty state of the Redraw button */
@keyframes dirty-pulse {
  0% { background-color: rgba(24, 63, 154, 1); }
  50% { background-color: rgba(36, 84, 190, 1); }
  100% { background-color: rgba(24, 63, 154, 1); }
}
.controls {
  display: flex;
  flex-shrink: 0;
  height: control-bar-height;
  width: 100%;
  background-color: window-background;

  a {
    padding: 8px;
    display: flex;
    flex: 1;
    border-left: 1px solid secondary-border;
    justify-content: center;
    align-items: center;
  }
  a.dirty {
  background-color: rgba(24, 63, 154, 1)
  animation: dirty-pulse 2200ms ease-in-out infinite;
  }

  a:first-child {
    border-left: 0;
  }
  a.share-btn {
    display: none;
    svg {
      fill: white;
    }
  }
  a.toggle-pause {
    flex: 0.3;
  }
}
/* Respect user reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .controls a.dirty {
    animation: none;
  }
}
pre.error {
  background: severe-error-background;
  color: #ffff;
  margin: 0px -8px;
  padding: 0 8px;
}

@media (max-width: small-screen) {
  a.about-link {
    bottom: 0;
  }

  .controls-container {
    width: 100%;
  }
}
@media print {
  #app {
    display: none;
  }
  canvas {
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    position: absolute;
  }
}
</style>
