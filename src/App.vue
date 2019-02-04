<template>
  <div class="root">
    <transition name="el-zoom-in-top">
      <el-alert
        class="alert"
        v-if="disconnected"
        title="Mock服务已被关闭或重启，请刷新当前页面"
        type="error"
        center
        show-icon
      />
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
      <dialog-panel slot="right-top" />
      <editor-panel slot="right-bottom" />
    </split-layout>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapMutations, mapState } from 'vuex'
import ElementUI from 'element-ui'

import SplitLayout from './components/SplitLayout'
import SessionList from './modules/sessionList/SessionMain'
import DialogPanel from './modules/dialog/DialogMain'
import EditorPanel from './modules/editor/EditorMain'

Vue.use(ElementUI)

export const title = ''

export const store = {}

export default {
  name: 'App',
  components: {
    SplitLayout,
    SessionList,
    DialogPanel,
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
      if (cur && !pre) {
        this.showConnectedAlert = true
        setTimeout(() => {
          this.showConnectedAlert = false
        }, 2000)
      }
      if (!cur && pre) {
        this.disconnected = true
      }
    },
  },
  created() {
    this.setSocket()
  },
  methods: {
    ...mapMutations(['setSocket']),
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
  font: 12px/1.5 'Chinese Quote', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue',
    Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
    'Segoe UI Symbol';
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
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
}
</style>
