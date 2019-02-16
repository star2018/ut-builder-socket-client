<template>
  <div class="code-mirror">
    <code-editor
      class="code-editor"
      v-model="code"
      :placeholder="placeholder"
      :options="editorOptions"
      @ready="handleReady"
      v-on="$listeners"
    />
  </div>
</template>

<script>
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/comment/continuecomment'
import 'codemirror/addon/comment/comment'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/lint/json-lint'
import 'codemirror/addon/lint/javascript-lint'
import 'codemirror/mode/javascript/javascript'

import { codemirror as CodeEditor } from 'vue-codemirror'

export default {
  name: 'CodeMirror',
  props: {
    value: {
      type: [String, Boolean, Number],
      default: '',
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    placeholder: {
      type: String,
      default: '',
    },
  },

  components: {
    CodeEditor,
  },

  data() {
    const { value } = this.$props
    return {
      code: value,
    }
  },

  computed: {
    editorOptions() {
      const { options } = this
      const setup = Object.assign({}, options)
      return Object.assign(
        {
          styleActiveLine: true,
          styleSelectedText: true,
          line: false,
          lineNumbers: true,
          matchBrackets: true,
          continueComments: 'Enter',
          indentUnit: 2,
          tabSize: 2,
          lint: true,
          mode: 'javascript',
        },
        setup,
        {
          extraKeys: {
            'Ctrl-/': 'toggleComment',
            ...Object.assign({}, setup.extraKeys),
          },
        },
        {
          theme: 'neat',
        }
      )
    },
  },

  watch: {
    value(cur) {
      this.code = cur
    },

    code(cur) {
      this.$emit('input', cur)
    },
  },

  beforeDestroy() {
    if (this.editor) {
      this.editor.toTextArea()
    }
  },

  methods: {
    handleReady(editor) {
      this.editor = editor
    },

    focus() {
      this.$nextTick(() => {
        const { editor } = this
        if (editor) {
          editor.refresh()
          editor.focus()
        }
      })
    },

    setCursor(line, column) {
      this.$nextTick(() => {
        const { editor } = this
        if (editor) {
          const doc = editor.getDoc()
          doc.setCursor({
            line: line - 1,
            ch: column,
          })
        }
      })
    },
  },
}
</script>

<style lang="less">
@import '~codemirror/lib/codemirror.css';
@import '~codemirror/addon/lint/lint.css';
@import '~codemirror/theme/neat.css';

.code-mirror {
  .code-editor {
    .CodeMirror {
      height: 100%;
    }
  }
}

.CodeMirror-lint-marker-error,
.CodeMirror-lint-marker-warning,
.CodeMirror-lint-marker-multiple,
.CodeMirror-lint-message-error,
.CodeMirror-lint-message-warning {
  background-image: none;
  padding-left: 0;
}
.CodeMirror-lint-tooltip {
  z-index: 999999999;
}
</style>

<style lang="less" scoped>
.code-mirror {
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  .code-editor {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
}
</style>
