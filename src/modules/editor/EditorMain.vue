<template>
  <div class="editor-box">
    <tool-bar
      :session="session"
      :auto-mock="!!mocker"
      @json-edit="jsonEdit"
      @json-pretty="jsonPretty"
      @clear="clearMessageList"
      @show-history="showHistory"
      @auto-mock="toggleMocker"
    />

    <template v-if="session">
      <code-editor
        ref="codeEditor"
        :key="session.token"
        :editor.sync="editor"
        previewer="json"
        v-model="message"
        @commit="commit"
      />
    </template>

    <history-dialog
      @remove="removeHistory"
      @remove-all="removeAllHistory"
      :visible.sync="visible.history"
      :data="history"
    />

    <mocker-dialog :visible.sync="visible.mocker" />
  </div>
</template>

<script>
import {
  mapActions as globalMapActions,
  mapGetters as globalMapGetters,
  mapMutations as globalMapMutations,
  mapState as globalMapState,
} from 'vuex'

import JSON5 from 'json5'
import throttle from 'lodash/throttle'

import CodeEditor from '../../components/CodeEditor'
import ToolBar from './ToolBar'
import HistoryDialog from './HistoryDialog'
import MockerDialog from './MockerDialog'

export default {
  name: 'EditorPanel',

  components: { CodeEditor, MockerDialog, HistoryDialog, ToolBar },

  data() {
    return {
      message: '',
      history: [],
      mocker: undefined,
      editor: 'text',
      visible: {
        history: false,
        mocker: false,
      },
    }
  },

  computed: {
    ...globalMapState(['session']),
    ...globalMapGetters(['getHistory']),
  },

  watch: {
    session(cur) {
      this.message = cur ? cur.message : ''
      this.editor = cur ? cur.editor || 'text' : 'text'
      this.mocker = undefined
    },

    message(cur) {
      const { session } = this
      if (session) {
        session.message = cur
      }
    },

    editor(cur) {
      const { session } = this
      if (session) {
        session.editor = cur
      }
    },

    mocker(cur) {
      if (!cur) {
        this.clearAutoMock()
      } else {
        this.setAutoMock()
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
        this.$refs.codeEditor.pretty()
      },
      200,
      {
        leading: true,
        trailing: false,
      }
    ),

    jsonEdit: throttle(
      function() {
        const { session, editor } = this
        if (!session) {
          return
        }
        this.editor = editor === 'json' ? 'text' : 'json'
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

    toggleMocker() {
      if (this.mocker) {
        this.mocker = undefined
      } else {
        this.visible.mocker = true
      }
    },

    clearAutoMock() {},

    setAutoMock() {},
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
