<template>
  <div
    ref="codeBox"
    class="code-panel"
    :class="{ collapsed: innerCollapsed, editable }"
  >
    <span
      v-if="
        (code && showCopyButton) || (innerCollapsible && showCollapseButton)
      "
      class="button-bar"
    >
      <clipboard-button
        v-if="code && showCopyButton"
        :text="code"
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
      <code-mirror
        v-if="editable"
        v-model="codeValue"
        :options="editorOptions"
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
import CodeMirror from './editor/CodeMirror'

export default {
  name: 'CodePanel',
  components: { CodeMirror, ClipboardButton },
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
      default: false,
    },
    highlight: {
      type: Boolean,
      default: true,
    },
    editable: {
      type: Boolean,
      default: false,
    },
    editorOptions: {
      type: Object,
      default: () => ({}),
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
        this.$nextTick(() => {
          this.codeValue = this.pretty(this.codeValue, true)
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
    this.setCodeFragment(this.code)
    if (this.editable) {
      this.codeValue = this.pretty(this.codeValue, true)
    }
  },

  methods: {
    setCodeFragment(code) {
      if (this.editable) {
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
      code = typeof code === 'string' ? code.trim() : ''
      console.log(prettierPlugins)
      try {
        code = code
          ? prettier.format(code, {
              parser: this.editable ? 'babel' : 'json',
              plugins: [prettierPlugins],
              printWidth: Math.floor(this.$refs.codeBox.clientWidth / 12),
            })
          : ''
      } catch (e) {
        if (!silent) {
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

  &.editable {
    height: 100%;
    .code-box {
      overflow: visible;
      font-size: 14px;
    }
  }

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
  padding: 2px 20px 8px 8px;
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
