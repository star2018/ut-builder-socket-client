<template>
  <div class="editor-box">
    <tool-bar
      :session="session"
      @json-edit="jsonEdit"
      @json-pretty="jsonPretty"
    />

    <template v-if="editor === 'json'">
      <json-editor :key="session.token" ref="jsonEditor" v-model="message" />
    </template>

    <text-editor
      v-else
      ref="textEditor"
      v-model="message"
      :disabled="!session"
      @keyup.ctrl.enter="commit"
    />
  </div>
</template>

<script>
import {
  mapState as globalMapState,
  mapActions as globalMapActions,
} from 'vuex'

import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'
import throttle from 'lodash/throttle'

import JsonEditor from './JsonEditor'
import TextEditor from './TextEditor'
import ToolBar from './ToolBar'

export default {
  name: 'EditorPanel',

  components: { ToolBar, TextEditor, JsonEditor },

  data() {
    return {
      message: '',
    }
  },

  computed: {
    ...globalMapState(['session']),

    disabled() {
      const { session } = this
      return !session
    },

    editor() {
      const { session } = this
      return (session ? session.editor : '') || 'text'
    },
  },

  watch: {
    message(cur) {
      const { session } = this
      if (session) {
        session.message = cur
      }
    },

    disabled(cur) {
      if (cur) {
        this.message = ''
      }
    },

    session(cur) {
      this.message = cur ? cur.message : ''
      if (cur && cur.editor === 'text') {
        this.$nextTick(() => {
          this.$refs.textEditor.focus()
        })
      }
    },
  },

  methods: {
    ...globalMapActions(['send']),

    async commit() {
      const { session } = this
      if (session) {
        await this.send({ token: session.token, data: this.message })
        this.message = ''
      }
    },

    jsonPretty: throttle(
      function() {
        const editorType = this.editor === 'json' ? 'jsonEditor' : 'textEditor'
        const editor = this.$refs[editorType]
        this.message = editor.pretty()
        if (editorType === 'textEditor') {
          this.$nextTick(() => {
            this.$refs.textEditor.focus()
          })
        }
      },
      200,
      {
        leading: true,
        trailing: false,
      }
    ),

    jsonEdit: throttle(
      function() {
        const { session } = this
        if (!session) {
          return
        }
        const { editor } = session
        if (editor === 'json') {
          session.editor = 'text'
          this.$nextTick(() => {
            this.jsonPretty()
          })
        } else {
          const { message } = this
          try {
            this.message = message.trim()
              ? prettier.format(message, {
                  parser: 'json-stringify',
                  plugins: [prettierPlugins],
                })
              : '{}'
            session.editor = 'json'
          } catch (e) {
            this.$notify.error({
              title: 'JSON格式错误',
              dangerouslyUseHTMLString: true,
              message: `<pre class="notification-content-ellipsis" >${
                e.message
              }</pre>`,
            })
          }
        }
      },
      200,
      {
        leading: true,
        trailing: false,
      }
    ),
  },
}
</script>

<style lang="less" scoped>
.editor-box {
  height: 100%;
  position: relative;
  padding-top: 40px;
  box-sizing: border-box;
}
</style>
