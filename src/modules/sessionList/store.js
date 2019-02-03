import uuid from 'uuid/v4'

export default {
  state: {
    sessionGroup: {},
  },

  mutations: {
    //
    connect(state, connection) {
      const { sessionGroup } = state
      const { path, token } = connection
      const group = sessionGroup[path] || []
      for (const s of group) {
        if (s.token === token) {
          return
        }
      }
      group.push({
        ...connection,
        messages: [],
        message: '',
        editor: 'text',
        title: '',
        disconnected: false,
      })
      state.sessionGroup = {
        ...sessionGroup,
        [path]: group,
      }
    },

    //
    disconnect(state, { token }) {
      const { sessionGroup } = state
      let matched = null
      for (const group of Object.values(sessionGroup)) {
        for (const session of group) {
          if (session.token === token) {
            matched = session
            break
          }
        }
        if (matched) {
          break
        }
      }
      if (matched) {
        matched.disconnected = true
      }
    },

    //
    receive(state, { token, data }) {
      const { sessionGroup } = state
      for (const group of Object.values(sessionGroup)) {
        const session = group.find((s) => s.token === token)
        if (session) {
          session.messages.push({
            timestamp: Date.now(),
            content: data,
            key: uuid(),
            from: 'server',
          })
          break
        }
      }
    },

    remove({ sessionGroup }, { token }) {
      for (const groups of Object.values(sessionGroup)) {
        for (let i = 0; i < groups.length; i++) {
          const session = groups[i]
          if (session.token === token) {
            return groups.splice(i, 1)
          }
        }
      }
    },
  },

  getters: {
    sessions(state) {
      const { sessionGroup } = state
      return Object.keys(sessionGroup).reduce((sessions, path) => {
        const group = sessionGroup[path]
        const length = group.length
        if (length > 1) {
          sessions.push({
            title: path,
            key: path,
            children: group.map((session, i) =>
              Object.assign(session, {
                title: `${session.path}#${i + 1}`,
                key: session.token,
              })
            ),
          })
        } else if (length) {
          const session = group[0]
          sessions.push(
            Object.assign(session, {
              title: session.path,
              key: session.token,
            })
          )
        }
        return sessions
      }, [])
    },

    //
    getSession(state, getters) {
      return (token) => {
        for (const session of getters.sessions) {
          if (session.token === token) {
            return session
          }
          if (Array.isArray(session.children)) {
            for (const child of session.children) {
              if (child.token === token) {
                return child
              }
            }
          }
        }
        return null
      }
    },
  },
}
