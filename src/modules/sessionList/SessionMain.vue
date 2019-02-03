<template>
  <aside-menu
    class="menu"
    :items="sessions"
    :active="session ? session.token : ''"
    @select="setSession(getSession(arguments[0]))"
  />
</template>

<script>
import {
  createNamespacedHelpers,
  mapState as globalMapState,
  mapMutations as globalMapMutations,
} from 'vuex'
import AsideMenu from '../../components/AsideMenu'

//
const { mapGetters, mapMutations } = createNamespacedHelpers('sessionList')

export default {
  name: 'SessionList',
  components: { AsideMenu },
  watch: {
    socket(socket) {
      this.attachEvent(socket)
    },
    sessions(cur) {
      const { session } = this
      if (!session && cur && cur.length) {
        this.setSession(cur[0])
      }
    },
    session(cur, pre) {
      if (!cur && pre) {
        this.notify('close', pre)
        this.remove(pre)
      }
    },
  },
  created() {
    this.attachEvent(this.socket)
  },
  computed: {
    ...globalMapState(['socket', 'session']),
    ...mapGetters(['sessions', 'getSession']),
  },
  methods: {
    ...globalMapMutations(['setSession']),
    ...mapMutations(['connect', 'disconnect', 'receive', 'remove']),
    //
    attachEvent(socket) {
      if (!socket) {
        return
      }
      socket.on('message', (message) => {
        const { type, ...connection } = Object.assign({}, message)
        switch (type) {
          case 'connection':
            this.connect(connection)
            break
          case 'disconnect':
            this.disconnect(connection)
            break
          case 'data':
            this.receive(connection)
            break
        }
        this.notify(type, connection)
      })
    },

    notify(type, { token }) {
      const session = this.getSession(token)
      let messageType = 'info'
      let messageTitle = '消息'
      let message = ''
      if (session) {
        const { title, path } = session
        message = title || path
        //
        switch (type) {
          case 'connection':
            messageType = 'success'
            messageTitle = '会话已连接'
            break
          case 'disconnect':
            messageType = 'error'
            messageTitle = '会话已断开'
            break
          case 'data':
            if (session !== this.session) {
              messageTitle = '收到新消息'
            } else {
              message = ''
            }
            break
          case 'close':
            messageTitle = '会话已关闭'
            break
        }
        //
      }
      if (message) {
        this.$notify({
          type: messageType,
          title: messageTitle,
          message,
        })
      }
    },
  },
}
</script>

<style lang="less" scoped>
.menu {
  height: 100%;
}
</style>
