<template>
  <div class="root">
    <transition name="el-zoom-in-top">
      <el-alert
        class="alert"
        v-if="disconnected"
        title="Mock服务已关闭或重启，请刷新当前页面"
        type="error"
        center
        show-icon
      />
    </transition>

    <transition name="el-zoom-in-top">
      <el-alert
        class="alert"
        v-if="showConnectedAlert"
        title="Mock服务已连接"
        type="success"
        center
        show-icon
      />
    </transition>

    <split-layout>
      <session-list slot="left" />
      <session-panel slot="right-top" />
      <editor-panel slot="right-bottom" />
    </split-layout>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapState, mapActions } from 'vuex'
import ElementUI from 'element-ui'

import SplitLayout from './components/SplitLayout'
import SessionList from './modules/sessionList/SessionListMain'
import SessionPanel from './modules/session/SessionMain'
import EditorPanel from './modules/editor/EditorMain'

Vue.use(ElementUI)

export const title = ''

export const store = {}

export default {
  name: 'App',
  components: {
    SplitLayout,
    SessionList,
    SessionPanel,
    EditorPanel,
  },

  data() {
    return {
      disconnected: false,
      showConnectedAlert: false,
    }
  },

  computed: {
    ...mapState(['socket']),
  },

  watch: {
    socket(cur, pre) {
      if (cur) {
        if (!pre) {
          this.showConnectedAlert = true
          setTimeout(() => {
            this.showConnectedAlert = false
          }, 3000)
        }
        this.disconnected = false
      } else {
        this.showConnectedAlert = false
        this.disconnected = !!pre
      }
    },
  },

  created() {
    this.initSocket(MOCK_SERVER)
  },

  methods: {
    ...mapActions(['initSocket']),
  },
}
</script>

<style lang="less">
@import '~element-ui/lib/theme-chalk/index.css';
@import './assets/fonts/iconfont.css';

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

body {
  font: 12px/1.5 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #303133;
}

.el-notification__group {
  overflow: hidden;
  .notification-content-ellipsis {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>

<style lang="less" scoped>
.root {
  width: 100%;
  height: 100%;
}

.alert {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 10;
  height: 50px;
  border-radius: 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
