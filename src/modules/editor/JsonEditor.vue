<template>
  <split-panels class="json-editor-wrap" watch-slots>
    <div
      class="json-editor-scroll"
      splitpanes-default="60"
      splitpanes-min="20"
      splitpanes-max="80"
    >
      <div class="json-editor" ref="jsonEditorContainer"></div>
    </div>

    <div
      ref="codeBox"
      class="json-code json-editor-scroll"
      splitpanes-default="40"
    >
      <pre ref="code" class="highlight-code" v-html="codeFragment"></pre>
    </div>
  </split-panels>
</template>

<script>
import JsonView from 'json-view'
import highlight from 'highlight.js'
import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'
import SplitPanels from 'splitpanes'

export default {
  name: 'JsonEditor',

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  components: { SplitPanels },

  data() {
    return {
      codeFragment: '',
    }
  },

  watch: {
    value(val) {
      this.codeFragment = this.getCodeFragment(val)
    },
    codeFragment() {
      this.$nextTick(() => {
        highlight.highlightBlock(this.$refs.code)
      })
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
    window.editor = editor
    this.jsonEditor = editor
    editor.expand(true)
    this.$refs.jsonEditorContainer.appendChild(editor.dom)
    this.codeFragment = this.getCodeFragment(JSON.stringify(json))
    //
    this.refresh()
  },

  methods: {
    getCodeFragment(code) {
      return this.pretty(code)
        .split(/(?:\r)?\n/g)
        .map((code) => `<code>${code}</code>`)
        .join('<br/>')
    },

    refresh() {
      this.refreshTimer = setTimeout(() => {
        this.$emit('input', JSON.stringify(this.jsonEditor.value))
        this.refresh()
      }, 300)
    },

    pretty(value = this.value) {
      try {
        value = value.trim()
          ? prettier.format(value, {
              parser: 'json',
              plugins: [prettierPlugins],
              printWidth: Math.floor(this.$refs.codeBox.clientWidth / 12),
            })
          : ''
      } catch (e) {
        this.$message.error('json格式不正确')
      }
      return value
    },
  },

  beforeDestroy() {
    clearInterval(this.refreshTimer)
    if (this.jsonEditor) {
      this.jsonEditor.destroy()
    }
  },
}
</script>

<style lang="less">
@import '~json-view/devtools.css';
@import '~highlight.js/styles/default.css';

.json-editor-wrap {
  &.splitpanes--vertical {
    .splitpanes__splitter {
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
  border-top: 1px solid #e2e2e2;

  .highlight-code {
    margin: 0;
    font-size: 12px;
    overflow: visible;
    float: left;
    min-width: 100%;
    box-sizing: border-box;
  }
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
