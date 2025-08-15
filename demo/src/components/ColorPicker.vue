<template>
  <div class='color-container'>
    <input type='text' @click.prevent='showPicker' :value='displayColor' readonly class='color-label'>
    <div class='picker' @click='hidePicker' v-if='opened' ref='pickerOverlay'>
      <chrome-color-picker v-model="internalColor" :style='getPickerStyle()'></chrome-color-picker>
    </div>
  </div>
</template>

<script>
import { Chrome } from '@ckpack/vue-color';
export default {
  name: 'ColorPicker',
  props: {
    color: {
      type: String,
      required: true
    }
  },
  components: {
    'chrome-color-picker': Chrome
  },
  data() {
    return {
      opened: false,
      internalColor: this.color // start with incoming rgba string
    };
  },
  computed: {
    displayColor() {
      if (typeof this.internalColor === 'string') return this.internalColor;
      if (this.internalColor && this.internalColor.rgba) {
        const { r, g, b, a } = this.internalColor.rgba;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
      return this.color;
    }
  },
  watch: {
    color(newVal) {
      // External update from parent
      if (newVal !== this.displayColor) this.internalColor = newVal;
    },
    internalColor: {
      deep: true,
      handler(newVal) {
        // When picker updates, propagate rgba
        if (newVal && newVal.rgba) {
          this.$emit('changed', newVal.rgba);
        } else if (typeof newVal === 'string') {
          const parsed = this.extractRGBA(newVal);
            this.$emit('changed', parsed);
        }
      }
    }
  },
  methods: {
    showPicker() {
      this.opened = true;
    },
    hidePicker(e) {
      if (e.target === this.$refs.pickerOverlay) this.opened = false;
    },
    getPickerStyle() {
      let rect = this.$el.getBoundingClientRect();
      return {
        position: 'absolute',
        left: (rect.left - 30) + 'px',
        top: (rect.top - 179) + 'px'
      }
    },
    extractRGBA(str) {
      const m = str && str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9]*\.?[0-9]+))?\s*\)/i);
      if (!m) return { r:255,g:255,b:255,a:1 };
      return { r:+m[1], g:+m[2], b:+m[3], a: m[4] !== undefined ? +m[4] : 1 };
    }
  }
}
</script>
<style lang='stylus'>
.color-container {
  width: 100%;
}
.picker {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}
input[type="text"].color-label {
  cursor: pointer;
  font-size: 12px;
}

</style>
