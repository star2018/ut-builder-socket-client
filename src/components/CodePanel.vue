<template>
  <div ref="codeBox" class="code-panel">
    <pre ref="code" class="highlight-code" v-html="codeFragment"></pre>
  </div>
</template>

<script>
import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'
import highlight from 'highlight.js'

export default {
  name: 'CodePanel',

  props: {
    code: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      codeFragment: '',
    }
  },

  watch: {
    code(cur) {
      this.setCodeFragment(cur)
    },

    codeFragment() {
      this.$nextTick(() => {
        highlight.highlightBlock(this.$refs.code)
      })
    },
  },

  mounted() {
    this.setCodeFragment(this.code)
  },

  methods: {
    setCodeFragment(code) {
      this.codeFragment = this.getCodeFragment(code)
    },

    pretty(code, silent) {
      try {
        code = code.trim()
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
      return this.pretty(code, true)
        .split(/(?:\r)?\n/g)
        .map((code) => `<code>${code}</code>`)
        .join('<br/>')
    },
  },
}
</script>

<style lang="less" scoped>
@import '~highlight.js/styles/default.css';

.code-panel {
  width: 100%;
  box-sizing: border-box;
}

.highlight-code {
  margin: 0;
  font-size: 12px;
  overflow: visible;
  float: left;
  min-width: 100%;
  box-sizing: border-box;
}
</style>
