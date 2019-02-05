<template>
  <aside-menu
    class="aside-menu"
    :active="session ? session.token : ''"
    :items="sessionGroups"
    @select="setSessionByToken"
  />
</template>

<script>
import {
  mapState as globalMapState,
  mapMutations as globalMapMutations,
} from 'vuex'
import uuid from 'uuid/v4'

import AsideMenu from '../../components/AsideMenu'

export default {
  name: 'SessionList',
  components: { AsideMenu },

  watch: {
    sessionList(cur) {
      const { session } = this
      if (!session && cur.length) {
        // 始终激活一个会话
        this.setSession(cur[0])
      }
    },
  },

  computed: {
    ...globalMapState(['session', 'sessionList']),

    // 会话分组
    sessionGroups() {
      const groups = {}
      for (const session of this.sessionList) {
        const { path } = session
        const group = groups[path] || []
        group.push(session)
        groups[path] = group
      }
      return Object.keys(groups).reduce((tree, path) => {
        const group = groups[path]
        const length = group.length
        if (length > 1) {
          tree.push({
            key: uuid(),
            title: path,
            children: group.map((session, index) =>
              Object.assign(session, {
                key: session.token,
                title: `${session.path}#${index + 1}`,
              })
            ),
          })
        } else if (length) {
          const session = group[0]
          tree.push(
            Object.assign(session, {
              key: session.token,
              title: session.path,
            })
          )
        }
        return tree
      }, [])
    },
  },

  methods: {
    ...globalMapMutations(['setSession', 'setSessionByToken']),
  },
}
</script>

<style lang="less" scoped>
.aside-menu {
  height: 100%;
}
</style>
