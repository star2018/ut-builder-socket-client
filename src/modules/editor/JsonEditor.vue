<template>
  <split-panels class="json-editor-wrap" @resized="handleResize" watch-slots>
    <div
      class="json-editor-scroll"
      splitpanes-default="60"
      splitpanes-min="20"
      splitpanes-max="80"
    >
      <div class="json-editor" ref="jsonEditorContainer"></div>
    </div>

    <code-panel
      ref="codePanel"
      class="json-editor-scroll"
      splitpanes-default="40"
      :code="value"
      :show-collapse-button="false"
    />
  </split-panels>
</template>

<script>
import JsonView from 'json-view'
import SplitPanels from 'splitpanes'

import CodePanel from '../../components/CodePanel'

export default {
  name: 'JsonEditor',

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  components: { CodePanel, SplitPanels },

  mounted() {
    const { value } = this
    const code = value.trim()
    let json = code ? JSON.parse(code) : {}
    if (!json || (typeof json !== 'object' && !Array.isArray(json))) {
      json = {}
    }
    const editor = new JsonView(json)
    this.jsonEditor = editor
    editor.expand(true)
    this.$refs.jsonEditorContainer.appendChild(editor.dom)
    //
    this.refresh(true)
  },

  methods: {
    refresh(immediate) {
      this.refreshTimer = setTimeout(
        () => {
          this.$emit('input', JSON.stringify(this.jsonEditor.value))
          this.refresh()
        },
        immediate ? 0 : 300
      )
    },

    pretty(value = this.value, ...args) {
      return this.$refs.codePanel.pretty(value, ...args)
    },

    handleResize() {
      this.$emit('input', this.pretty(this.value, true))
    },
  },

  beforeDestroy() {
    clearTimeout(this.refreshTimer)
    if (this.jsonEditor) {
      this.jsonEditor.destroy()
    }
  },
}
</script>

<style lang="less">
@import '~splitpanes/dist/splitpanes.css';
@import '~json-view/devtools.css';

.json-editor-wrap {
  &.splitpanes--vertical {
    .splitpanes__splitter {
      background-color: #e4e7ed;
      &:before {
        position: absolute;
        content: '';
        left: -4px;
        width: 8px;
        top: 0;
        height: 100%;
        z-index: 1;
      }
    }
  }
}
</style>

<style lang="less" scoped>
.json-editor-wrap {
  width: 100%;
  height: 100%;
  border-top: 1px solid #e4e7ed;
}

.json-editor-scroll {
  overflow: auto;
  height: 100%;
  width: 100%;
}

.json-editor {
  padding: 8px 80px 80px 16px;
  box-sizing: border-box;
  &:after {
    content: '';
    display: block;
    width: 0;
    height: 0;
    clear: both;
  }
}
</style>
