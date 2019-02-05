<template>
  <div class="status-bar">
    <template v-if="session">
      <div class="info-bar">
        <span
          class="connect-state"
          :class="{ disconnected: session.disconnected }"
          :title="session.disconnected ? '已断开' : '已连接'"
        ></span>
        <span>{{ session.title }}</span>
      </div>

      <div class="button-bar">
        <i
          class="iconfont icon-close"
          title="关闭"
          @click="$emit('remove-session')"
        ></i>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'StatusBar',
  props: {
    session: {
      type: Object,
      default: null,
    },
  },
}
</script>

<style lang="less" scoped>
.status-bar {
  height: 50px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  border-bottom: 1px solid #e2e2e2;
  box-sizing: border-box;
}

.info-bar {
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
  transition: background-color 1s, box-shadow 1s;

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
</style>
