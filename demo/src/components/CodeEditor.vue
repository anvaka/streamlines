<template>
  <div class="code-editor">
    <div ref="editor" class="cm-container"></div>
    <div class='error-container'>
      <pre v-if='model.error' class='error hl'>{{ model.error }}</pre>
    </div>
  </div>
</template>

<script>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import bus from '../bus.js';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/addon/comment/comment.js';
import 'codemirror/theme/material.css';

export default {
  name: 'CodeEditor',
  props: ['model'],
  setup(props) {
    const editorEl = ref(null);
    let cmInstance;
    let pendingSetCode;

    function applyCodeUpdate() {
      props.model.setCode(props.model.code);
    }

    const refreshEditor = (isCollapsed) => {
      if (!isCollapsed && cmInstance) setTimeout(() => cmInstance.refresh(), 30);
    };

    onMounted(() => {
      cmInstance = CodeMirror(editorEl.value, {
        value: props.model.code,
        mode: 'javascript',
        theme: 'material',
        lineNumbers: true,
        viewportMargin: Infinity
      });
      cmInstance.on('change', () => {
        props.model.code = cmInstance.getValue();
      });
      cmInstance.setOption('extraKeys', {
        'Cmd-/': (cm) => cm.toggleComment({ indent: true, lineComment: '//' }),
        'Ctrl-/': (cm) => cm.toggleComment({ indent: true, lineComment: '//' })
      });
  bus.on('settings-collapsed', refreshEditor);
  // Initial refresh to ensure proper sizing when panel is visible
  setTimeout(() => cmInstance && cmInstance.refresh(), 50);
    });

    onBeforeUnmount(() => {
  bus.off('settings-collapsed', refreshEditor);
    });

    watch(() => props.model.code, () => {
      if (pendingSetCode) clearTimeout(pendingSetCode);
      pendingSetCode = setTimeout(() => {
        applyCodeUpdate();
        pendingSetCode = 0;
      }, 300);
      if (cmInstance && cmInstance.getValue() !== props.model.code) {
        // External update
        cmInstance.setValue(props.model.code);
      }
    });

    return { editor: editorEl };
  }
};
</script>
<style lang="stylus">
@import './theme.styl'

.code-editor {
maxHeight = 320px;

  .CodeMirror {
    height: auto;
    max-height: maxHeight;
    font-size: 14px;
    z-index: 0;
    padding-bottom: 8px;
    .CodeMirror-scroll {
      height: auto;
      max-height: maxHeight;
    }
  }

  .cm-s-oceanic-next.CodeMirror {
    background: transparent;
  }
  .cm-s-material.CodeMirror {
    background: transparent;
  }
}

.cm-container {
  min-height: 160px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
}

.CodeMirror-scroll {
  max-height: 320px;
}

/* Themed gutter to better match overall site palette */
.CodeMirror-gutters {
  background: rgba(6,24,56,0.55) !important; /* window-background with transparency */
  border-right: 1px solid rgba(69,91,125,0.6); /* secondary-border tone */
}
.CodeMirror-linenumber {
  color: #658bbd; /* secondary-text */
  font-size: 12px;
  opacity: 0.9;
}
.CodeMirror-guttermarker-subtle { color: #435970; }
.CodeMirror-foldgutter-open, .CodeMirror-foldgutter-folded { color: #99c5f1; }
</style>
