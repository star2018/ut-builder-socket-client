<template>
  <split-layout>
    <session-list slot="left" />
    <dialog-panel slot="right-top" />
    <editor-panel slot="right-bottom" />
  </split-layout>
</template>

<script>
import Vue from 'vue'
import { mapMutations } from 'vuex'
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
