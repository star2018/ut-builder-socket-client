<template>
  <div class="session-panel">
    <status-bar
      class="status-bar"
      :session="session"
      @remove-session="remove"
    />

    <el-alert
      class="close-mocker-alert"
      v-show="mocking"
      type="success"
      @close="stopMock"
      center
    >
      <div slot="title">
        <span>{{ mockAlertTitle }}</span>
        <span class="timer" v-if="execMockAfterTime !== -1">{{
          execMockAfterTime
        }}</span>
      </div>
    </el-alert>

    <message-list class="message-list" :session="session" />
  </div>
</template>

<script>
import {
  mapState as globalMapState,
  mapActions as globalMapActions,
  mapMutations as globalMapMutations,
  mapGetters as globalMapGetters,
} from 'vuex'

import StatusBar from './StatusBar'
import MessageList from './MessageList'

export default {
  name: 'SessionPanel',
  components: { MessageList, StatusBar },

  data() {
    return {
      mockTimerString: '',
    }
  },

  computed: {
    ...globalMapState(['session', 'socket']),
    ...globalMapGetters(['getSessionByToken']),

    mocking() {
      const { session } = this
      return session && session.mocker ? !!session.mocker.enabled : false
    },

    execMockAfterTime() {
      const { session, mocking } = this
      return mocking ? session.execMockAfterTime : -1
    },

    mockAlertTitle() {
      const { session, mocking } = this
      if (mocking) {
        return `自动发送开启中（${
          session.mocker.timer ? '定时发送' : '自动回复'
        }）`
      }
      return '自动发送已终止'
    },
  },

  watch: {
    socket(cur, pre) {
      if (cur !== pre) {
        this.detachEvent(pre)
        this.attachEvent(cur)
      }
    },
  },

  beforeDestroy() {
    this.detachEvent(this.socket)
  },

  methods: {
    ...globalMapActions(['close']),
    ...globalMapMutations([
      'removeSession',
      'setSession',
      'setMocker',
      'setSessionByToken',
    ]),

    stopMock() {
      this.setMocker({
        token: this.session.token,
        enabled: false,
      })
    },

    attachEvent(socket) {
      if (!socket) {
        return
      }
      socket.on(
        'message',
        (this.messageHandler = (data) => {
          const { type, token } = Object.assign({}, data)
          const session = this.getSessionByToken(token)
          if (!session) {
            return
          }
          if (type === 'disconnect') {
            this.$notify.info({
              title: '会话已断开',
              message: session.title,
            })
          } else if (type === 'connection') {
            this.$nextTick(() => {
              const cur = this.session
              if (cur && cur.token !== token) {
                this.showSessionNotify(
                  { type: 'success', title: '会话已连接' },
                  session
                )
              }
            })
          } else if (type === 'data') {
            if (session !== this.session) {
              this.showSessionNotify(
                { type: 'info', title: '收到新消息' },
                session
              )
            }
          }
        })
      )
    },

    detachEvent(socket) {
      if (!socket) {
        return
      }
      const { messageHandler } = this
      if (messageHandler) {
        socket.off('message', messageHandler)
        this.messageHandler = null
      }
    },

    showSessionNotify({ type, title }, session) {
      const h = this.$createElement
      const { token } = session
      this.$notify({
        type,
        title,
        message: h('div', { class: 'notify-message-wrap' }, [
          h('div', { class: 'message-content' }, session.title),
          h(
            'a',
            {
              class: 'message-anchor',
              on: {
                click: () => {
                  this.setSessionByToken(token)
                },
              },
            },
            '查看'
          ),
        ]),
      })
    },

    remove() {
      const { session } = this
      const { token, title, disconnected } = session
      const handler = () => {
        this.removeSession(token)
        this.setSession(null)
        this.$notify.info({
          title: '会话已关闭',
          message: title,
        })
      }
      if (disconnected) {
        handler()
        return
      }
      this.$confirm('当前会话仍处于连接状态，确定要关闭当前会话吗？', '关闭', {
        type: 'warning',
      }).then(
        () => {
          this.close(token)
          handler()
        },
        () => {}
      )
    },
  },
}
</script>

<style lang="less">
.notify-message-wrap {
  .message-content {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .message-anchor {
    display: block;
    color: #409eff;
    cursor: pointer;
    margin-top: 2px;
  }
}
</style>

<style lang="less" scoped>
.session-panel {
  background-color: #f0f0f0;
  font-size: 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.message-list {
  width: 100%;
  flex: 1 1 auto;
}

.status-bar {
  flex: none;
}

.close-mocker-alert {
  height: 24px;
  flex: none;
  box-sizing: border-box;
  border-radius: 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);

  .timer {
    font-weight: bold;
  }
}
</style>
