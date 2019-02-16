<template>
  <div
    ref="codeBox"
    class="code-panel"
    :class="{ collapsed: innerCollapsed, editable }"
  >
    <span v-if="showButtonBar" class="button-bar">
      <clipboard-button
        v-if="showClipboardButton"
        :text="editable ? value : code"
        class="code-button"
      />
      <i
        v-if="innerCollapsible && showCollapseButton"
        class="iconfont code-button"
        :title="innerCollapsed ? '展开' : '折叠'"
        :class="{
          'icon-expand': innerCollapsed,
          'icon-collapse': !innerCollapsed,
        }"
        @click="innerCollapsed = !innerCollapsed"
      ></i>
    </span>
    <div class="code-box">
      <text-editor
        ref="editor"
        v-if="editable"
        v-model="codeValue"
        :editor-options="editorOptions"
        :show-error-notify="showErrorNotify"
        :locate-error-position="locateErrorPosition"
        :format="format"
        @format-error="$emit('format-error', arguments[0])"
        editor="code"
      />
      <pre
        v-else
        class="code-wrap"
      ><code :key="codeKey" ref="code" class="highlight-code">{{codeFragment}}</code></pre>
    </div>
  </div>
</template>

<script>
import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'
import highlight from 'highlight.js'
import uuid from 'uuid/v4'

import ClipboardButton from './ClipboardButton'
import TextEditor from './editor/TextEditor'

export default {
  name: 'CodePanel',
  components: { TextEditor, ClipboardButton },
  props: {
    code: {
      type: [String, Boolean, Number],
      default: '',
    },
    value: {
      type: [String, Boolean, Number],
      default: '',
    },
    collapse: {
      type: Number,
      default: 8,
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
    collapsible: {
      type: Boolean,
      default: false,
    },
    showCollapseButton: {
      type: Boolean,
      default: true,
    },
    showCopyButton: {
      type: Boolean,
      default: true,
    },
    highlight: {
      type: Boolean,
      default: true,
    },
    editable: {
      type: Boolean,
      default: false,
    },
    format: String,
    editorOptions: Object,
    showErrorNotify: Boolean,
    locateErrorPosition: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    const { collapsed, collapsible, value } = this.$props
    return {
      codeFragment: '',
      codeKey: uuid(),
      codeValue: value,
      innerCollapsed: !!collapsed,
      innerCollapsible: !!collapsible,
      highlighted: false,
    }
  },

  computed: {
    showClipboardButton() {
      const { code, value, showCopyButton, editable } = this
      return !!(showCopyButton && (editable ? value.trim() : code.trim()))
    },

    showButtonBar() {
      const { innerCollapsible, showCollapseButton, showClipboardButton } = this
      return !!(showClipboardButton || (showCollapseButton && innerCollapsible))
    },
  },

  watch: {
    code(cur) {
      this.innerCollapsed = false
      this.innerCollapsible = false
      this.setCodeFragment(cur)
    },

    value(cur) {
      this.codeValue = cur
    },

    codeValue(cur) {
      this.$emit('input', cur)
    },

    editable(cur) {
      if (cur) {
        this.setCodeFragment()
        this.$nextTick(() => {
          this.setCodeValue()
        })
      }
    },

    codeFragment() {
      this.highlighted = false
      this.codeKey = uuid()
      if (!this.innerCollapsed) {
        this.highlightCode()
      }
    },

    collapsed(cur) {
      this.innerCollapsed = !!cur
    },

    collapsible(cur) {
      this.innerCollapsible = !!cur
    },

    innerCollapsed(cur) {
      this.$emit('update:collapsed', !!cur)
      if (!cur) {
        this.highlightCode()
      }
    },

    innerCollapsible(cur) {
      this.$emit('update:collapsible', !!cur)
    },
  },

  mounted() {
    const { code, editable } = this
    this.setCodeFragment(code)
    if (editable) {
      this.setCodeValue()
    }
  },

  methods: {
    setCodeValue() {
      const { codeValue, code } = this
      this.codeValue = this.pretty(codeValue.trim() || code, true)
    },

    setCodeFragment(code) {
      if (this.editable) {
        this.codeFragment = ''
        this.innerCollapsible = false
        return
      }
      const codeFragment = this.getCodeFragment(code)
      const { collapse } = this
      this.innerCollapsible = !!(
        collapse && codeFragment.split(/\r?\n/g).length > +collapse
      )
      if (!this.innerCollapsible) {
        this.innerCollapsed = false
      }
      this.codeFragment = codeFragment
    },

    pretty(code, silent) {
      const { editable } = this
      code = typeof code === 'string' ? code.trim() : ''
      if (editable) {
        return this.$refs.editor.pretty(code, silent)
      }
      try {
        code = code
          ? prettier.format(code, {
              parser: 'json',
              plugins: [prettierPlugins],
              printWidth: Math.floor(
                this.$refs.codeBox.clientWidth / (editable ? 14 : 12)
              ),
            })
          : ''
      } catch (e) {
        this.$emit('format-error', e)
        if (!silent && this.showErrorNotify) {
          this.$notify.error({
            title: '格式化失败',
            dangerouslyUseHTMLString: true,
            message: `<pre class="notification-content-ellipsis">${
              e.message
            }</pre>`,
          })
        }
      }
      return code
    },

    focus() {
      this.$nextTick(() => {
        const { codeMirror } = this.$refs
        if (codeMirror) {
          codeMirror.focus()
        }
      })
    },

    getCodeFragment(code) {
      return this.pretty(code, true).trim()
    },

    highlightCode() {
      if (!this.highlight || this.highlighted || this.editable) {
        return
      }
      this.$nextTick(() => {
        highlight.highlightBlock(this.$refs.code)
        this.highlighted = true
      })
    },
  },
}
</script>

<style lang="less" scoped>
@import '~highlight.js/styles/default.css';

.code-panel {
  width: 100%;
  box-sizing: border-box;
  position: relative;
  overflow: visible;

  &:after {
    content: '';
    display: block;
    width: 0;
    height: 0;
    clear: both;
  }

  &.collapsed {
    .code-wrap {
      max-height: 84px;
      overflow: hidden;

      &:after {
        font-size: 12px;
        background-color: #f0f0f0;
        content: '...';
        position: absolute;
        padding: 0 20px 8px;
        width: 100%;
        height: 2.2em;
        left: 0;
        bottom: 0;
        box-sizing: border-box;
        z-index: 1;
        font-weight: bold;
      }
    }
  }

  &.editable {
    height: 100%;
    .code-box {
      overflow: visible;
      font-size: 14px;
    }

    .button-bar {
      background-color: transparent;
      z-index: 5;
    }
  }
}

.code-box {
  width: 100%;
  height: 100%;
  overflow: auto;
  font-size: 12px;
}

.code-wrap {
  margin: 0;
  float: left;
  min-width: 100%;
  box-sizing: border-box;
  position: relative;
  padding: 8px;
  overflow: visible;
  background-color: #f0f0f0;
  font-size: 0;
  line-height: 1.5;

  &:after {
    content: '';
    display: block;
    width: 0;
    height: 0;
    clear: both;
  }
}

.highlight-code {
  margin: 0;
  padding: 0;
  overflow: visible;
  background-color: transparent;
  font-size: 12px;
  line-height: 1.5;
}

.button-bar {
  position: absolute;
  right: 0;
  top: 8px;
  line-height: 1em;
  padding: 1px 20px 8px 8px;
  cursor: pointer;
  z-index: 10;
  background-color: #f0f0f0;
  color: #8c8c8c;

  .code-button {
    margin-left: 8px;
    cursor: pointer;
  }

  .code-button {
    &:hover {
      color: #595959;
    }
  }
}
</style>
