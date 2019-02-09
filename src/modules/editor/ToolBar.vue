<template>
  <div class="toolbar">
    <div class="button-bar left-bar">
      <i
        class="iconfont icon-format"
        title="json格式化"
        @click="$emit('json-pretty')"
      ></i>
      <i
        class="iconfont icon-json"
        :class="{ active: editor === 'json' }"
        title="json编辑模式"
        @click="$emit('json-edit')"
      ></i>
      <i
        class="iconfont icon-history"
        title="历史记录"
        @click="$emit('show-history')"
      ></i>
    </div>
    <div class="button-bar right-bar">
      <i
        class="iconfont icon-clear"
        title="清空消息"
        @click="$emit('clear')"
      ></i>
    </div>
    <div v-if="!session" class="toolbar-mask"></div>
  </div>
</template>

<script>
export default {
  name: 'ToolBar',
  props: {
    session: {
      type: Object,
      default: null,
    },
  },
  computed: {
    editor() {
      const { session } = this
      return session ? session.editor : ''
    },
  },
}
</script>

<style lang="less" scoped>
.toolbar {
  width: 100%;
  height: 40px;
  line-height: normal;
  padding: 4px 16px;
  box-sizing: border-box;
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;

  .button-bar {
    display: flex;
    align-items: center;
  }

  .left-bar {
    .iconfont {
      margin-right: 14px;
    }
  }

  .right-bar {
    .iconfont {
      margin-left: 14px;
    }
  }

  .iconfont {
    font-size: 26px;
    color: #606266;
    cursor: pointer;

    &:hover {
      color: #303133;
    }

    &.active {
      color: #00e600;
    }
  }
}

.toolbar-mask {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
  cursor: not-allowed;
}
</style>
