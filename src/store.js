import io from 'socket.io-client'
import uuid from 'uuid/v4'

export default {
  //
  state: {
    socket: null,
    session: null,
    sessionList: [],
  },

  actions: {
    // 初始化socket
    async initSocket({ commit, getters, state }, server) {
      const { address, context } = Object.assign({}, server)
      let { socket } = state
      if (socket) {
        socket.close()
      }
      socket = io(`http://${address}`, {
        transports: ['websocket'],
        path: context,
      })
      socket.on('connect', () => {
        commit('setSocket', socket)
      })
      socket.on('disconnect', () => {
        commit('setSocket', null)
      })
      socket.on('message', (message) => {
        const { type, ...connection } = Object.assign({}, message)
        if (type === 'connection') {
          commit('createSession', connection)
        } else if (type === 'disconnect') {
          commit('closeSession', connection.token)
        } else if (type === 'data') {
          commit('pushMessage', {
            session: getters.getSessionByToken(connection.token),
            content: connection.data,
            from: 'server',
            success: true,
          })
        }
      })
    },

    // 发送数据
    async send({ state, getters, commit }, { token, data }) {
      const { socket } = state
      let success = false
      if (socket) {
        try {
          await socket.send({
            type: 'data',
            token,
            data,
          })
          success = true
        } catch (e) {
          //
        }
      }
      commit('pushMessage', {
        success,
        from: 'client',
        content: data,
        session: getters.getSessionByToken(token),
      })
    },

    // 关闭连接
    async close({ commit, state }, token) {
      const { socket } = state
      if (socket) {
        try {
          await socket.send({
            type: 'disconnect',
            token,
          })
        } catch (e) {
          //
        }
      }
      commit('closeSession', token)
    },
  },

  //
  mutations: {
    // 设置当前socket
    setSocket(state, socket) {
      state.socket = socket
    },

    // 设置当前会话信息
    setSession(state, session) {
      state.session = session
    },

    // 根据token设置当前会话信息
    setSessionByToken(state, token) {
      for (const session of state.sessionList) {
        if (session.token === token) {
          state.session = session
          break
        }
      }
    },

    // 创建会话
    createSession(state, connection) {
      state.sessionList.push({
        ...connection,
        title: connection.path,
        message: '',
        messages: [],
        editor: 'text',
        disconnected: false,
      })
    },

    // 关闭会话
    closeSession(state, token) {
      const { sessionList } = state
      for (const session of sessionList) {
        if (session.token === token) {
          session.disconnected = true
          break
        }
      }
    },

    // 移除会话
    removeSession(state, token) {
      const { sessionList } = state
      for (let i = 0; i < sessionList.length; i++) {
        const session = sessionList[i]
        if (session.token === token) {
          sessionList.splice(i, 1)
          break
        }
      }
    },

    // 添加会话消息
    pushMessage(state, message) {
      const { session, content, from } = Object.assign({}, message)
      if (
        session &&
        Array.isArray(session.messages) &&
        /^(client|server)$/.test(from)
      ) {
        session.messages.push({
          timestamp: Date.now(),
          key: uuid(),
          content,
          from,
        })
      }
    },
  },

  getters: {
    // 根据token获取会话信息
    getSessionByToken: (state) => (token) => {
      for (const session of state.sessionList) {
        if (session.token === token) {
          return session
        }
      }
    },
  },
}
