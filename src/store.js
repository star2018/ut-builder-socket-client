import io from 'socket.io-client'
import uuid from 'uuid/v4'
import timestamp from 'time-stamp'
import lastIndexOf from 'lodash/findLastIndex'
import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'

function detectJson(code) {
  code = typeof code === 'string' ? code.trim() : ''
  if (code) {
    try {
      prettier.format(code, {
        parser: 'json-stringify',
        plugins: [prettierPlugins],
      })
      return true
    } catch (e) {
      //
    }
  }
  return false
}

function stringify(code) {
  try {
    return prettier.format(code, {
      parser: 'json-stringify',
      plugins: [prettierPlugins],
    })
  } catch (e) {
    return code
  }
}

export default {
  //
  state: {
    // socket连接对象
    socket: null,
    // 当前会话信息
    session: null,
    // 会话列表
    sessionList: [],
  },

  actions: {
    //
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
      const session = getters.getSessionByToken(token)
      let success = false
      if (session && !session.disconnected && socket) {
        try {
          await socket.send({
            type: 'data',
            token,
            data: stringify(data),
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
      const time = timestamp('HH:mm')
      const { token } = connection
      const openState = {
        time,
        timestamp: Date.now(),
        key: uuid(),
        content: `${time} - 已连接`,
        from: 'state',
      }
      //
      for (const session of state.sessionList) {
        if (session.token === token) {
          if (session.disconnected) {
            session.disconnected = false
            session.messages.push(openState)
          }
          return
        }
      }
      //
      state.sessionList.push({
        ...connection,
        title: connection.path,
        message: '',
        messages: [openState],
        editor: 'text',
        disconnected: false,
      })
    },

    // 关闭会话
    closeSession(state, token) {
      const time = timestamp('HH:mm')
      const { sessionList } = state
      for (const session of sessionList) {
        if (session.token === token) {
          session.disconnected = true
          session.messages.push({
            time,
            timestamp: Date.now(),
            key: uuid(),
            content: `${time} - 已断开`,
            from: 'state',
          })
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
      const now = Date.now()
      const time = timestamp('HH:mm')
      const { session, content, from, success } = Object.assign({}, message)
      if (
        session &&
        Array.isArray(session.messages) &&
        /^(client|server|state)$/.test(from)
      ) {
        const { messages } = session

        let appendState = false
        const len = messages.length
        const lastIndexOfState = lastIndexOf(
          messages,
          (item) => item.from === 'state'
        )
        const lastState = messages[lastIndexOfState] || null
        if (!lastState) {
          appendState = true
        } else if (lastState && now - lastState.timestamp > 60 * 1000) {
          if (now - lastState.timestamp > 50 * 60 * 1000) {
            appendState = true
          } else {
            if (len - lastIndexOfState > 3) {
              appendState = true
            }
          }
        }

        if (appendState) {
          messages.push({
            time,
            timestamp: now,
            key: uuid(),
            content: time,
            from: 'state',
            success: true,
          })
        }

        messages.push({
          time,
          timestamp: Date.now(),
          key: uuid(),
          content,
          from,
          success,
          json: detectJson(content),
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
