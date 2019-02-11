<template>
  <div class="json-editor">
    <div class="json-editor-container" ref="jsonEditorContainer"></div>
  </div>
</template>

<script>
import JsonView from 'json-view'

export default {
  name: 'JsonEditor',

  props: {
    value: {
      type: String,
      default: '',
    },
  },

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
  },

  beforeDestroy() {
    clearTimeout(this.refreshTimer)
    if (this.jsonEditor) {
      this.jsonEditor.destroy()
    }
  },
}
</script>

<style lang="less" scoped>
@import '~json-view/devtools.css';

.json-editor {
  width: 100%;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.json-editor-container {
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
