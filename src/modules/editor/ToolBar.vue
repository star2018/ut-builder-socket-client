<template>
  <div class="toolbar">
    <i
      class="iconfont icon-json"
      :class="{ active: editor === 'json' }"
      title="json编辑模式"
      @click="$emit('json-edit')"
    ></i>
    <i
      class="iconfont icon-format"
      title="json格式化"
      @click="$emit('json-pretty')"
    ></i>
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
  align-items: center;
  flex-wrap: nowrap;

  .iconfont {
    font-size: 24px;
    margin-right: 14px;
    color: #666;
    cursor: pointer;

    &:hover {
      color: #000;
    }

    &.active {
      color: #00e600;
    }

    &.icon-json {
      font-size: 26px;
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
