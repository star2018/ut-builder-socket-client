<template>
  <div class="text-editor" :class="{ 'is-code-editor': editor === 'code' }">
    <div ref="editorBox" class="code-editor-wrap" v-if="editor === 'code'">
      <span v-show="!value" class="placeholder-mocker">{{ placeholder }}</span>
      <code-mirror
        ref="codeEditor"
        :value="value"
        :options="codeEditorOptions"
        @input="$emit('input', arguments[0])"
        @ready="handleReady"
      />
    </div>

    <textarea
      v-else
      class="text-editor-input"
      ref="editorBox"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="{ disabled }"
      :value="value"
      v-bind="$attrs"
      v-on="listeners"
      @keyup.ctrl.enter="$emit('commit')"
      autofocus
    ></textarea>
  </div>
</template>

<script>
import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'

import CodeMirror from './CodeMirror'

export default {
  name: 'TextEditor',
  components: { CodeMirror },
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Boolean, Number],
      default: '',
    },
    editor: {
      type: String,
      default: 'textarea',
    },
    format: {
      type: String,
      default() {
        if (this.editor === 'code') {
          return 'js'
        }
        return 'json'
      },
    },
    editorOptions: Object,
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    showErrorNotify: {
      type: Boolean,
      default: true,
    },
    locateErrorPosition: {
      type: Boolean,
      default: true,
    },
  },

  computed: {
    listeners() {
      return Object.assign({}, this.$listeners, {
        input: (event) => {
          this.$emit('input', event.target.value)
        },
      })
    },

    codeEditorOptions() {
      const { editorOptions, format } = this
      const options = Object.assign({}, editorOptions)
      if (/^js$/i.test(format)) {
        options.mode = 'javascript'
      } else if (/^json$/i.test(format)) {
        options.mode = 'application/json'
      }
      return options
    },
  },

  methods: {
    pretty(value = this.value, silent) {
      const { editor, format } = this
      if (!/^(?:json|js)$/i.test(format)) {
        return value
      }
      try {
        value = value.trim()
          ? prettier.format(value, {
              parser:
                editor === 'code' && /^js$/i.test(format)
                  ? 'babel'
                  : 'json-stringify',
              plugins: [prettierPlugins],
              printWidth: Math.floor(this.$refs.editorBox.clientWidth / 14),
            })
          : ''
      } catch (e) {
        this.$emit('format-error', e)
        if (!silent && this.showErrorNotify) {
          this.$notify.error({
            title: 'JSON格式化失败',
            dangerouslyUseHTMLString: true,
            message: `<pre class="notification-content-ellipsis">${
              e.message
            }</pre>`,
          })
        }
        if (this.locateErrorPosition && e.loc) {
          const editor = this.$refs.codeEditor
          if (editor && e.loc.start) {
            const { line, column } = e.loc.start
            editor.setCursor(line, column)
          }
        }
      }
      return value
    },

    focus() {
      this.$nextTick(() => {
        if (this.editor === 'code') {
          this.$refs.codeEditor.focus()
        } else {
          this.$refs.editorBox.focus()
        }
      })
    },

    handleReady(editor) {
      editor.setOption('extraKeys', {
        'Ctrl-Enter': () => this.$emit('commit'),
      })
    },
  },
}
</script>

<style lang="less" scoped>
.text-editor {
  padding: 8px 0 16px 16px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  &.is-code-editor {
    padding: 0;
  }
}

.text-editor-input {
  outline: none;
  box-sizing: border-box;
  padding: 0;
  resize: none;
  border: none;
  font-size: 14px;
  width: 100%;
  height: 100%;
  background-color: transparent;

  &.disabled {
    cursor: not-allowed;
  }
}

.code-editor-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: visible;
  font-size: 14px;

  .placeholder-mocker {
    position: absolute;
    left: 35px;
    top: 4px;
    font-size: inherit;
    color: #c0c4cc;
    z-index: 1;
    line-height: inherit;
  }
}
</style>
