import socket from 'socket.io-client'
import uuid from 'uuid/v4'

export default {
  //
  state: {
    socket: null,
    session: null,
  },

  actions: {
    async send({ state }, message) {
      const { socket, session } = state
      if (socket && session) {
        await socket.send({
          type: 'data',
          token: session.token,
          data: message,
        })
        session.messages.push({
          timestamp: Date.now(),
          content: message,
          key: uuid(),
          from: 'mock',
        })
      }
    },

    async close({ commit, state }) {
      const { socket, session } = state
      if (socket && session) {
        const { token } = session
        if (token) {
          await socket.send({
            type: 'disconnect',
            token,
          })
          commit('setSession', null)
        }
      }
    },
  },

  //
  mutations: {
    //
    setSocket(state) {
      if (state.socket) {
        state.socket.close()
      }
      if (typeof MOCK_CONTEXT !== 'undefined') {
        const { address, context } = Object.assign({}, MOCK_CONTEXT)
        state.socket = socket(`http://${address}`, {
          transports: ['websocket'],
          path: context,
        })
        state.socket.on('disconnect', () => {
          state.socket = null
        })
      }
    },

    //
    setSession(state, session) {
      state.session = session
    },
  },
}
