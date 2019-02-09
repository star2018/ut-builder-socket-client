<template>
  <div class="editor-box">
    <tool-bar
      :session="session"
      @json-edit="jsonEdit"
      @json-pretty="jsonPretty"
      @clear="clearMessageList"
      @show-history="showHistory"
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

    <history-dialog
      @remove="removeHistory"
      @remove-all="removeAllHistory"
      :visible.sync="visible.history"
      :data="history"
    />
  </div>
</template>

<script>
import {
  mapState as globalMapState,
  mapActions as globalMapActions,
  mapMutations as globalMapMutations,
  mapGetters as globalMapGetters,
} from 'vuex'

import JSON5 from 'json5'
import throttle from 'lodash/throttle'

import JsonEditor from './JsonEditor'
import TextEditor from './TextEditor'
import ToolBar from './ToolBar'
import HistoryDialog from './HistoryDialog'

export default {
  name: 'EditorPanel',

  components: { HistoryDialog, ToolBar, TextEditor, JsonEditor },

  data() {
    return {
      message: '',
      history: [],
      visible: {
        history: false,
      },
    }
  },

  computed: {
    ...globalMapState(['session']),
    ...globalMapGetters(['getHistory']),

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
    ...globalMapMutations(['clearMessages', 'clearHistory', 'clearAllHistory']),

    async commit() {
      const { session, message } = this
      if (session && message.trim()) {
        let data = null
        try {
          data = JSON5.parse(message)
        } catch (e) {
          data = message
        }
        await this.send({ token: session.token, data })
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
            const json = message.trim() ? JSON5.parse(message) : {}
            this.message = JSON.stringify(json)
            session.editor = 'json'
          } catch (e) {
            this.$notify.error({
              title: 'JSON格式错误',
              dangerouslyUseHTMLString: true,
              message: `<div class="text-word-break-wrap">${e.message.replace(
                /^JSON5:\s*/,
                ''
              )}</div>`,
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

    clearMessageList() {
      const { session } = this
      if (session) {
        this.clearMessages(session.token)
      }
    },

    showHistory() {
      const { session } = this
      if (session) {
        const { path } = session
        this.history = this.getHistory(path).history
        this.visible.history = true
      }
    },

    removeHistory(items) {
      const { session } = this
      if (session) {
        const { path } = session
        this.clearHistory({
          path,
          items,
        })
        this.showHistory()
      }
    },

    removeAllHistory() {
      const { session } = this
      if (session) {
        const { path } = session
        this.clearAllHistory(path)
        this.showHistory()
      }
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

<style lang="less" scoped>
.editor-box {
  height: 100%;
  position: relative;
  padding-top: 40px;
  box-sizing: border-box;
}
</style>
