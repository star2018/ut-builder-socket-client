<template>
  <div class="text-editor" :class="{ 'is-code-editor': editor === 'code' }">
    <div ref="textarea" class="code-editor-wrap" v-if="editor === 'code'">
      <span v-show="!value" class="placeholder-mocker">{{ placeholder }}</span>
      <code-mirror
        ref="codeEditor"
        :value="value"
        @input="$emit('input', arguments[0])"
        @ready="handleReady"
      />
    </div>

    <textarea
      v-else
      class="text-editor-input"
      ref="textarea"
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
  },

  computed: {
    listeners() {
      return Object.assign({}, this.$listeners, {
        input: (event) => {
          this.$emit('input', event.target.value)
        },
      })
    },
  },

  methods: {
    pretty(value = this.value, silent) {
      try {
        value = value.trim()
          ? prettier.format(value, {
              parser: 'json5',
              plugins: [prettierPlugins],
              printWidth: Math.floor(this.$refs.textarea.clientWidth / 14),
            })
          : ''
      } catch (e) {
        this.$emit('format-error', e.message)
        if (!silent && this.showErrorNotify) {
          this.$notify.error({
            title: 'JSON格式化失败',
            dangerouslyUseHTMLString: true,
            message: `<pre class="notification-content-ellipsis">${
              e.message
            }</pre>`,
          })
        }
      }
      return value
    },

    focus() {
      this.$nextTick(() => {
        if (this.editor === 'code') {
          this.$refs.codeEditor.focus()
        } else {
          this.$refs.textarea.focus()
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
