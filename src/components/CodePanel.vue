<template>
  <div ref="codeBox" class="code-panel" :class="{ collapsed: innerCollapsed }">
    <span class="button-bar">
      <clipboard-button
        v-if="showCopyButton"
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
      <pre
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

export default {
  name: 'CodePanel',
  components: { ClipboardButton },
  props: {
    code: {
      type: String,
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
  },

  data() {
    const { collapsed, collapsible } = this.$props
    return {
      codeFragment: '',
      codeKey: uuid(),
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
  },

  methods: {
    setCodeFragment(code) {
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
      try {
        code = code
          ? prettier.format(code, {
              parser: 'json',
              plugins: [prettierPlugins],
              printWidth: Math.floor(this.$refs.codeBox.clientWidth / 12),
            })
          : ''
      } catch (e) {
        if (!silent) {
          this.$notify.error({
            title: 'JSON格式化失败',
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
      if (!this.highlight || this.highlighted) {
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
        padding: 0 20px 6px;
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
  padding: 6px;
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
  right: 18px;
  top: 8px;
  line-height: 1em;
  cursor: pointer;
  z-index: 10;
  background-color: #f0f0f0;
  color: #8c8c8c;
  padding-right: 2px;

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
