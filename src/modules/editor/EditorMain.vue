<template>
  <div class="editor-box">
    <tool-bar
      :session="session"
      @json-edit="jsonEdit"
      @json-pretty="jsonPretty"
      @clear="clearMessageList"
      @show-history="showHistory('message')"
      @auto-mock="toggleMocker"
    />

    <template v-if="session">
      <code-editor
        class="code-editor"
        ref="codeEditor"
        :key="session.token"
        :editor.sync="editor"
        text-editor="code"
        placeholder="按 Ctrl + Enter 发送"
        previewer="json"
        v-model="message"
        @commit="commit"
      />
    </template>

    <history-dialog
      :title="history.title"
      :clear-confirm-tips="history.clearTips"
      :visible.sync="visible.history"
      :key-map="history"
    />

    <mocker-dialog
      :visible.sync="visible.mocker"
      @create-mocker="createMocker"
      @show-history="showHistory('mocker')"
    />
  </div>
</template>

<script>
import {
  mapActions as globalMapActions,
  mapMutations as globalMapMutations,
  mapState as globalMapState,
} from 'vuex'

import Mock from 'mockjs'
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
      editor: 'text',
      history: {
        title: '',
        type: '',
        clearTips: '',
      },
      visible: {
        history: false,
        mocker: false,
      },
    }
  },

  computed: {
    ...globalMapState(['session']),
  },

  watch: {
    session(cur) {
      this.message = cur ? cur.message : ''
      this.editor = cur ? cur.editor || 'text' : 'text'
      if (cur) {
        this.$nextTick(() => {
          this.$refs.codeEditor.focus()
        })
      }
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
  },

  methods: {
    ...globalMapActions(['send']),
    ...globalMapMutations(['clearMessages', 'setMocker']),

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
        if (session.messages.length > 2) {
          this.$confirm('确定要清空当前会话的消息吗？', '清空', {
            type: 'warning',
          }).then(
            () => {
              this.clearMessages(session.token)
            },
            () => {}
          )
        } else {
          this.clearMessages(session.token)
        }
      }
    },

    showHistory(type) {
      this.history = this.getHistorySetup(type)
      this.visible.history = true
    },

    getHistorySetup(type) {
      const { session } = this
      if (session) {
        const title = type === 'message' ? '发送历史' : '脚本历史'
        return {
          type,
          title,
          clearTips: `确定要清空当前会话的${title}记录吗?`,
          path: session.path,
        }
      }
      return {
        type: '',
        title: '',
        clearTips: '',
        path: '',
      }
    },

    toggleMocker() {
      const { session } = this
      if (session.mocker) {
        this.clearMocker(session)
      } else {
        this.visible.mocker = true
      }
    },

    clearMocker(session) {
      const { token } = session
      this.setMocker({
        token,
      })
    },

    createMocker({ script, delay }) {
      const { session } = this
      if (!session) {
        return
      }
      let timer = null
      let caller = null
      if (delay) {
        timer = setInterval(() => {
          this.execMock(session, {})
        }, delay * 1000)
      } else {
        caller = (message) => {
          this.execMock(session, message)
        }
      }
      this.setMocker({
        token: session.token,
        script,
        timer,
        caller,
      })
    },

    async execMock(session, message) {
      const { mocker, token } = session
      if (mocker) {
        try {
          const data = await this.runInContext(
            mocker.script,
            {
              Mock,
            },
            message
          )
          await this.send({ token, data, mock: true })
        } catch (e) {
          this.clearMocker(session)
          this.$notify.error({
            title: '脚本执行失败，自动发送已终止',
            dangerouslyUseHTMLString: true,
            message: `<div class="notify-multiline-error-message">${
              e && typeof e === 'object' ? e.message || `${e}` : `${e}`
            }</div>`,
          })
        }
      }
    },

    async runInContext(code, context, data) {
      try {
        context = Object.assign(
          {
            self: {},
            window: {},
            parent: {},
            top: {},
            globalThis: {},
            document: {},
            frames: {},
            location: {},
            history: {},
            localStorage: {},
            eval() {},
            Function() {},
            resizeBy() {},
            resizeTo() {},
            open() {},
            close() {},
            print() {},
            stop() {},
            alert() {},
            confirm() {},
            prompt() {},
            setTimeout() {},
            setImmediate() {},
            setInterval() {},
            requestAnimationFrame() {},
          },
          context
        )
        const { args, values } = Object.keys(context).reduce(
          (env, key) => {
            const { args, values } = env
            args.push(key)
            values.push(context[key])
            return env
          },
          { args: [], values: [] }
        )
        const ctxArgs = args.join(',')
        code = `return function(${ctxArgs}){return((function(){${code};return Runner})())}`
        const executor = new Function(code)().apply(undefined, values)
        return executor.apply(undefined, [data])
      } catch (e) {
        throw e
      }
    },
  },
}
</script>

<style>
.notify-multiline-error-message {
  color: red;
  text-wrap: normal;
  white-space: normal;
  word-break: break-all;
  width: 100%;
  max-height: 600px;
  line-height: 1.5em;
  font-size: 14px;
}
</style>

<style lang="less" scoped>
.editor-box {
  height: 100%;
  position: relative;
  padding-top: 40px;
  box-sizing: border-box;
  .code-editor {
    border-top: 1px solid #e4e7ed;
  }
}
</style>
