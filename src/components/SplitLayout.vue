<template>
  <split-panels class="split-layout">
    <div
      class="panel-vertical"
      splitpanes-default="20"
      splitpanes-min="20"
      splitpanes-max="40"
    >
      <div class="layout-aside">
        <div class="logo-bar">
          <i class="logo"></i>
          <span class="title">Web Socket Mock</span>
        </div>
        <slot name="left" />
      </div>
    </div>
    <split-panels horizontal splitpanes-default="80">
      <div class="panel-vertical" splitpanes-default="60">
        <slot name="right-top" />
      </div>
      <div
        class="panel-vertical"
        splitpanes-default="40"
        splitpanes-min="20"
        splitpanes-max="80"
      >
        <slot name="right-bottom" />
      </div>
    </split-panels>
  </split-panels>
</template>

<script>
import SplitPanels from 'splitpanes'

export default {
  name: 'SplitLayout',
  components: {
    SplitPanels,
  },
}
</script>

<style lang="less">
@import '~splitpanes/dist/splitpanes.css';

.split-layout {
  &.splitpanes--vertical {
    .splitpanes__pane {
      min-width: 240px;
    }

    .splitpanes__splitter {
      position: relative;

      &:before {
        content: '';
        position: absolute;
        left: -4px;
        width: 8px;
        top: 0;
        height: 100%;
        z-index: 1;
      }
    }
  }

  .splitpanes--horizontal {
    .splitpanes__pane {
      min-height: 100px;
    }

    .splitpanes__splitter {
      position: relative;
      background-color: #dcdfe6;

      &:before {
        position: absolute;
        content: '';
        left: 0;
        top: -4px;
        height: 8px;
        width: 100%;
        z-index: 1;
      }
    }
  }
}
</style>

<style lang="less" scoped>
.layout-aside {
  height: 100%;
  padding-top: 50px;
  position: relative;
  box-sizing: border-box;
}

.logo-bar {
  height: 50px;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #002140;
  flex-wrap: nowrap;
}

.logo {
  width: 24px;
  height: 24px;
  background: url('../assets/img/logo.png') no-repeat;
  background-size: cover;
  margin-left: 16px;
}

.title {
  font-family: Avenir, 'Helvetica Neue', Arial, Helvetica, sans-serif;
  font-weight: 600;
  color: #fff;
  font-size: 20px;
  margin-left: 12px;
}

.panel-vertical {
  height: 100%;
}
</style>
