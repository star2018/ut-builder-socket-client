<template>
  <div class="dialog">
    <div class="title">
      <template v-if="session">
        <div class="state-bar">
          <span
            class="connect-state"
            :class="{ disconnected: session.disconnected }"
            :title="session.disconnected ? '已断开' : '已连接'"
          ></span>
          <span>{{ session.title }}</span>
        </div>
        <div class="button-bar">
          <i class="iconfont icon-close" title="关闭" @click="close"></i>
        </div>
      </template>
    </div>
    <ul class="list">
      <li v-for="item of contents" :key="item.key">
        {{ item.content }}
      </li>
    </ul>
  </div>
</template>

<script>
import {
  mapState as globalMapState,
  mapActions as globalMapActions,
} from 'vuex'
export default {
  name: 'DialogPanel',
  data() {
    return {}
  },
  computed: {
    ...globalMapState(['session']),
    contents() {
      const { session } = this
      if (session) {
        return session.messages
      }
      return []
    },
  },
  methods: {
    ...globalMapActions(['close']),
  },
}
</script>

<style lang="less" scoped>
.dialog {
  background-color: #f5f5f5;
  font-size: 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title {
  height: 50px;
  padding: 0 16px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  border-bottom: 1px solid #e2e2e2;
  box-sizing: border-box;
}

.state-bar {
  flex: 1 1 auto;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  box-sizing: border-box;
}

.connect-state {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-color: #00e600;
  border-radius: 50%;
  margin: 0 16px 0 4px;
  box-shadow: 0 0 8px 2px rgba(#00e600, 0.8);

  &.disconnected {
    background-color: #a8a8a8;
    box-shadow: 0 0 2px 2px rgba(#a8a8a8, 0.5);
  }
}

.button-bar {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  margin-left: 8px;

  .iconfont {
    cursor: pointer;
    font-size: 24px;
    color: #666;
    margin-left: 12px;

    &:hover {
      color: #000;
    }
  }
}

.list {
  flex: 1 1 auto;
  overflow-y: auto;
  margin: 0;
  padding: 8px 16px;
  box-sizing: border-box;
  list-style: none;
}
</style>
