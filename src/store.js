import io from 'socket.io-client'
import uuid from 'uuid/v4'
import hash from 'hash.js'
import timestamp from 'time-stamp'
import lastIndexOf from 'lodash/findLastIndex'
import isPlainObject from 'lodash/isPlainObject'
import JSON5 from 'json5'

function parse(code) {
  let obj
  try {
    obj = JSON5.parse(code)
  } catch (e) {
    obj = code
  }
  return obj
}

function detectType(code) {
  if (isPlainObject(code)) {
    return 'json'
  }
  if (typeof code !== 'object') {
    if (isPlainObject(parse(code))) {
      return 'json'
    }
    return 'text'
  }
  return 'object'
}

function stringify(code) {
  try {
    if (isPlainObject(code)) {
      return JSON.stringify(code)
    }
    if (typeof code !== 'object') {
      return code
    }
  } catch (e) {
    //
  }
  return `${code}`
}

function getHistoryKey(path) {
  return hash
    .sha1()
    .update(`ut-builder-socket-client-history-${path}`)
    .digest('hex')
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
        const { type, messages, ...connection } = Object.assign({}, message)
        if (type === 'connection') {
          commit('createSession', connection)
          if (Array.isArray(messages)) {
            const session = getters.getSessionByToken(connection.token)
            for (let i = 0; i < messages.length; i++) {
              const { content, timestamp: ts, from } = messages[i]
              if (i === 0 && ts) {
                const time = timestamp('HH:mm', new Date(ts))
                commit('pushMessage', {
                  time,
                  session,
                  timestamp: ts,
                  key: uuid(),
                  content: `${time}`,
                  from: 'state',
                  type: 'text',
                })
              }
              commit('pushMessage', {
                type: detectType(content),
                success: true,
                timestamp: ts,
                session,
                content,
                from,
              })
            }
          }
        } else if (type === 'disconnect') {
          commit('closeSession', connection.token)
        } else if (type === 'data') {
          const { data, token } = connection
          commit('pushMessage', {
            session: getters.getSessionByToken(token),
            type: detectType(data),
            content: data,
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
      const type = detectType(data)
      const content = stringify(data)
      if (session && !session.disconnected && socket) {
        try {
          await socket.send({
            token,
            type: 'data',
            data: content,
          })
          success = true
          //
          const { path } = session
          const { key, history } = getters.getHistory(path)
          history.unshift({
            type,
            content,
            timestamp: Date.now(),
          })
          localStorage.setItem(
            key,
            JSON.stringify(
              history.map(({ timestamp, type, content }) => ({
                tp: type,
                ts: timestamp,
                c: content,
              }))
            )
          )
        } catch (e) {
          //
        }
      }
      commit('pushMessage', {
        success,
        from: 'client',
        content,
        session,
        type,
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
        type: 'text',
      }
      //
      for (const session of state.sessionList) {
        if (session.token === token) {
          if (session.disconnected) {
            session.disconnected = false
            delete session.closeTimestamp
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
          session.closeTimestamp = Date.now()
          session.messages.push({
            time,
            timestamp: Date.now(),
            key: uuid(),
            content: `${time} - 已断开`,
            from: 'state',
            type: 'text',
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
      message = Object.assign({}, message)
      const now = message.timestamp || Date.now()
      const time = timestamp('HH:mm', new Date(now))
      const { from, session } = message
      if (
        session &&
        Array.isArray(session.messages) &&
        /^(client|server|state)$/.test(from)
      ) {
        const { content, success, type } = message
        const { messages } = session

        let appendState = false
        const len = messages.length
        const lastIndexOfState = lastIndexOf(
          messages,
          (item) => item.from === 'state'
        )
        const lastState = messages[lastIndexOfState] || null
        if (!lastState || now - lastState.timestamp > 50 * 60 * 1000) {
          appendState = true
        } else if (lastState && now - lastState.timestamp > 60 * 1000) {
          appendState = len - lastIndexOfState > 3
        }
        if (appendState) {
          messages.push({
            time,
            timestamp: now,
            key: uuid(),
            content: time,
            from: 'state',
            success: true,
            type: 'text',
          })
        }

        messages.push({
          time,
          timestamp: now,
          key: uuid(),
          content,
          type,
          from,
          success,
          collapsed: true,
          collapsible: false,
        })
      }
    },

    // 清除消息
    clearMessages(state, token) {
      const { sessionList, socket } = state
      for (let i = 0; i < sessionList.length; i++) {
        const session = sessionList[i]
        if (session.token === token) {
          const now = Date.now()
          const time = timestamp('HH:mm')
          const first = session.messages[0]
          session.messages = first ? [first] : []
          session.messages.push({
            time,
            timestamp: now,
            key: uuid(),
            content: `${time} - 消息已清空`,
            from: 'state',
            success: true,
            type: 'text',
          })
          break
        }
      }
      try {
        if (socket) {
          socket.send({
            type: 'clear-messages',
            token,
          })
        }
      } catch (e) {
        //
      }
    },

    // 清空指定的历史记录
    clearHistory(state, payload) {
      const { path, items } = payload
      const key = getHistoryKey(path)
      const value = localStorage.getItem(key)
      const histories = value ? JSON.parse(value) : []
      const updated = histories.filter(
        ({ ts }) => !items.some((item) => item.timestamp === ts)
      )
      localStorage.setItem(key, JSON.stringify(updated))
    },

    // 清空所有历史记录
    clearAllHistory(state, path) {
      localStorage.removeItem(getHistoryKey(path))
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

    // 获取历史消息记录
    getHistory: () => (path) => {
      const key = getHistoryKey(path)
      const value = localStorage.getItem(key)
      return {
        key,
        history: (value ? JSON.parse(value) : []).map(({ tp, ts, c }) => ({
          type: tp,
          timestamp: ts,
          content: c,
        })),
      }
    },
  },
}
