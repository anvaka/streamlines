<template>
<div class='code-editor'>
  <codemirror v-model='model.code' ref='editor' :options="{
    viewportMargin: Infinity,
    theme: 'oceanic-next',
    mode: 'javascript',
  }"></codemirror>
  <div class='error-container'>
    <pre v-if='model.error' class='error hl'>{{model.error}}</pre>
  </div> 
</div>
</template>

<script>
import bus from '../bus';
import { codemirror } from 'vue-codemirror-lite';
var CodeMirror = require('codemirror/lib/codemirror.js')
require('codemirror/mode/javascript/javascript')
var toggleComment = require('codemirror/addon/comment/comment.js');
function toggleComment(cm) {
  cm.toggleComment({
    indent: true,
    lineComment: '//'
  });
}


export default {
  name: 'CodeEditor',
  props: ['model'],
  components: {
    codemirror
  },
  mounted() {
    bus.on('settings-collapsed', refreshEditor, this);

    this.$refs.editor.editor.setOption('extraKeys', {
      'Cmd-/': toggleComment,
      'Ctrl-/': toggleComment
    });
  },
  beforeDestroy() {
    bus.off('settings-collapsed', refreshEditor, this);
  },
  watch: {
    'model.code': function() {
      if (this.pendingSetCode) {
        clearTimeout(this.pendingSetCode);
      }

      // We don't want to update code on each key stroke. This would have negative
      // impact on performance.
      this.pendingSetCode = setTimeout(() => {
        this.model.setCode(this.model.code);
        this.pendingSetCode = 0;
      }, 300);
    },
  }
}

function refreshEditor(isCollapsed) {
  // Code mirror sometimes is not visible https://stackoverflow.com/questions/8349571/codemirror-editor-is-not-loading-content-until-clicked
  if (!isCollapsed) {
    setTimeout(() => {
      this.$refs.editor.editor.refresh()
    }, 10);
  }
}
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
}
  .cm-s-oceanic-next.CodeMirror{
    background: transparent;
  }
}
</style>
