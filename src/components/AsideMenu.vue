<template>
  <el-menu
    class="aside-menu"
    collapse-transition
    mode="vertical"
    @select="select"
    :default-active="active"
  >
    <template v-for="item of items">
      <el-submenu v-if="item.children" :key="item.key" :index="item.key">
        <span slot="title">{{ item.title }}</span>
        <el-menu-item
          v-for="child of item.children"
          :key="child.key"
          :index="child.key"
        >
          <span slot="title">{{ child.title }}</span>
        </el-menu-item>
      </el-submenu>
      <el-menu-item v-else :key="item.key" :index="item.key">
        <span slot="title">{{ item.title }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script>
export default {
  name: 'AsideMenu',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    active: {
      type: String,
      default: '',
    },
  },
  methods: {
    select(...args) {
      this.$emit('select', ...args)
    },
  },
}
</script>

<style lang="less">
.aside-menu {
  overflow-y: auto;
  padding: 16px 0;

  &::-webkit-scrollbar {
    width: 0;
  }

  &.el-menu,
  .el-submenu {
    background-color: #001529;
    border-top: 1px solid #001529;
    border-bottom: 1px solid #001529;
    border-right: none;
    border-left: none;
    box-sizing: border-box;
    .el-menu--inline {
      background-color: #000c17;
    }
    &.is-opened {
      .el-submenu__title {
        color: #fff;
      }
      .el-submenu__icon-arrow {
        color: #fff;
      }
    }
  }

  .el-menu-item,
  .el-submenu__title {
    color: rgba(255, 255, 255, 0.65);
    height: 48px;
    line-height: 48px;
    margin: 8px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .el-submenu__title {
    padding-right: 50px;
  }

  .el-submenu__icon-arrow {
    color: rgba(255, 255, 255, 0.65);
    font-weight: bold;
  }

  .el-submenu {
    .el-menu-item {
      margin: 4px 0 8px;
      height: 48px;
      line-height: 48px;
    }
  }

  .el-menu-item,
  .el-submenu__title {
    &:hover {
      background-color: transparent;
      color: #fff;
    }
  }

  .el-menu-item {
    &.is-active {
      background-color: #1890ff;
      color: #fff;
    }
  }
}
</style>
