<template>
  <div class="text-editor-wrap">
    <textarea
      class="text-editor"
      ref="textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="{ disabled }"
      :value="value"
      v-bind="$attrs"
      v-on="listeners"
      autofocus
    ></textarea>
  </div>
</template>

<script>
import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'

export default {
  name: 'TextEditor',
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '按 Ctrl + Enter 发送',
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
      return value
    },

    focus() {
      this.$refs.textarea.focus()
    },
  },
}
</script>

<style lang="less" scoped>
.text-editor-wrap {
  padding: 8px 0 16px 16px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.text-editor {
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
</style>
