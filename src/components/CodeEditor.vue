<template>
  <div
    class="code-editor-container"
    :class="{ 'show-previewer': showPreviewer }"
  >
    <split-panels v-if="showPreviewer" @resized="handleResize" watch-slots>
      <div
        class="editor-wrap"
        splitpanes-default="60"
        splitpanes-min="20"
        splitpanes-max="80"
      >
        <json-editor
          v-if="editor === 'json'"
          ref="jsonEditor"
          v-model="innerValue"
        />

        <text-editor
          v-else
          ref="textEditor"
          :editor="textEditor"
          :placeholder="placeholder"
          :disabled="disabled"
          v-model="innerValue"
          :show-error-notify="showErrorNotify"
          @format-error="$emit('format-error', arguments[0])"
          @commit="$emit('commit')"
        />
      </div>

      <div class="previewer-wrap" splitpanes-default="40">
        <slot name="previewer" :value="innerValue">
          <code-panel
            ref="codePanel"
            splitpanes-default="40"
            :code="codeValue"
            :show-collapse-button="false"
            :show-error-notify="showErrorNotify"
            @format-error="$emit('format-error', arguments[0])"
          ></code-panel>
        </slot>
      </div>
    </split-panels>

    <div v-else class="editor-wrap">
      <json-editor
        v-if="editor === 'json'"
        ref="jsonEditor"
        v-model="innerValue"
      />

      <text-editor
        v-else
        ref="textEditor"
        :editor="textEditor"
        :placeholder="placeholder"
        :disabled="disabled"
        v-model="innerValue"
        :show-error-notify="showErrorNotify"
        @format-error="$emit('format-error', arguments[0])"
        @commit="$emit('commit')"
      />
    </div>
  </div>
</template>

<script>
import SplitPanels from 'splitpanes'
import JSON5 from 'json5'

import JsonEditor from './editor/JsonEditor'
import TextEditor from './editor/TextEditor'
import CodePanel from './CodePanel'

export default {
  name: 'code-editor',
  components: { SplitPanels, JsonEditor, TextEditor, CodePanel },
  props: {
    value: {
      type: [String, Boolean, Number],
      default: '',
    },
    placeholder: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    editor: {
      type: String,
      default: 'text',
    },
    textEditor: String,
    previewer: {
      type: [Boolean, String, Array],
      default: true,
    },
    showErrorNotify: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      innerValue: this.$props.value,
      codeValue: '',
    }
  },

  computed: {
    showPreviewer() {
      const { previewer, editor } = this
      if (Array.isArray(previewer)) {
        return previewer.includes(editor)
      } else if (typeof previewer === 'string') {
        return previewer === editor
      }
      return !!previewer
    },
  },

  watch: {
    value(cur) {
      this.innerValue = cur
    },

    innerValue(cur) {
      this.$emit('input', cur)
      this.$nextTick(() => {
        this.setCodeValue()
      })
    },

    editor(cur, pre) {
      if (cur === 'text') {
        this.$nextTick(() => {
          this.pretty(this.innerValue, true)
        })
      } else if (cur === 'json') {
        const { innerValue } = this
        try {
          const json = innerValue.trim() ? JSON5.parse(innerValue) : {}
          this.innerValue = JSON.stringify(json)
        } catch (e) {
          const error = e.message.replace(/^JSON5:\s*/i, '')
          this.$emit('update:editor', pre)
          this.$emit('format-error', error)
          if (this.showErrorNotify) {
            this.$notify.error({
              title: 'JSON格式错误',
              dangerouslyUseHTMLString: true,
              message: `<div class="text-word-break-wrap">${error}</div>`,
            })
          }
        }
      }
    },
  },

  mounted() {
    this.setCodeValue()
  },

  methods: {
    setCodeValue() {
      const codePanel = this.$refs.codePanel
      if (codePanel) {
        this.codeValue = codePanel.pretty(this.innerValue, true)
      } else {
        this.codeValue = ''
      }
    },

    pretty(...args) {
      if (this.editor !== 'json') {
        this.innerValue = this.$refs.textEditor.pretty(...args)
        this.focus()
      } else {
        this.setCodeValue()
      }
    },

    focus() {
      if (this.editor !== 'json') {
        this.$nextTick(() => {
          this.$refs.textEditor.focus()
        })
      }
    },

    handleResize() {
      this.pretty(this.innerValue, true)
      this.$emit('resize')
    },
  },
}
</script>

<style>
.text-word-break-wrap {
  word-break: break-all;
  white-space: normal;
}
</style>

<style lang="less">
@import '~splitpanes/dist/splitpanes.css';

.code-editor-container {
  &.show-previewer {
    .splitpanes--vertical {
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

    .previewer-wrap {
      .code-box {
        overflow: visible;
      }
    }
  }
}
</style>

<style lang="less" scoped>
.code-editor-container {
  height: 100%;
  box-sizing: border-box;

  &.show-previewer {
    border-top: 1px solid #e4e7ed;
  }
}

.editor-wrap {
  height: 100%;
  box-sizing: border-box;
}

.previewer-wrap {
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}
</style>
