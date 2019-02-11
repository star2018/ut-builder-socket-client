<template>
  <div class="code-mirror">
    <code-editor class="code-editor" v-model="code" :options="editorOptions" />
  </div>
</template>

<script>
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/comment/continuecomment'
import 'codemirror/addon/comment/comment'
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
      return Object.assign(
        {
          lineNumbers: true,
          matchBrackets: true,
          continueComments: 'Enter',
          extraKeys: { 'Ctrl-/': 'toggleComment' },
        },
        options,
        {
          mode: 'javascript',
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

  methods: {},
}
</script>

<style lang="less">
.code-mirror {
  .code-editor {
    .CodeMirror {
      height: 100%;
    }
  }
}
</style>

<style lang="less" scoped>
@import '~codemirror/lib/codemirror.css';
@import '~codemirror/theme/neat.css';

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
