<template>
  <div class="editor-box">
    <div class="toolbar">
      <i
        class="iconfont icon-json"
        :class="{ active: editor === 'json' }"
        title="json编辑模式"
        @click="jsonEdit"
      ></i>
      <i
        class="iconfont icon-format"
        title="json格式化"
        @click="jsonPretty"
      ></i>
      <div v-if="!session" class="toolbar-mask"></div>
    </div>

    <template v-if="editor === 'json'">
      <json-editor :key="session.token" ref="jsonEditor" v-model="message" />
    </template>

    <text-editor
      v-else
      ref="textEditor"
      v-model="message"
      :disabled="!session"
      @keyup.ctrl.enter="commit"
    />
  </div>
</template>

<script>
import {
  mapState as globalMapState,
  mapActions as globalMapActions,
} from 'vuex'

import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'
import throttle from 'lodash/throttle'

import JsonEditor from './JsonEditor'
import TextEditor from './TextEditor'

export default {
  name: 'EditorPanel',

  components: { TextEditor, JsonEditor },

  data() {
    return {
      message: '',
    }
  },

  computed: {
    ...globalMapState(['session']),

    disabled() {
      const { session } = this
      return !session
    },

    editor() {
      const { session } = this
      return (session ? session.editor : '') || 'text'
    },
  },

  watch: {
    message(cur) {
      const { session } = this
      if (session) {
        session.message = cur
      }
    },

    disabled(cur) {
      if (cur) {
        this.message = ''
      }
    },

    session(cur) {
      this.message = cur ? cur.message : ''
      if (cur && cur.editor === 'text') {
        this.$nextTick(() => {
          this.$refs.textEditor.focus()
        })
      }
    },
  },

  methods: {
    ...globalMapActions(['send']),

    async commit() {
      await this.send(this.message)
      this.message = ''
    },

    jsonPretty: throttle(
      function() {
        const editor = this.$refs[
          this.editor === 'json' ? 'jsonEditor' : 'textEditor'
        ]
        this.message = editor.pretty()
      },
      200,
      {
        leading: true,
        trailing: false,
      }
    ),

    jsonEdit: throttle(
      function() {
        const { session } = this
        if (!session) {
          return
        }
        const { editor } = session
        if (editor === 'json') {
          session.editor = 'text'
          this.$nextTick(() => {
            this.jsonPretty()
            this.$refs.textEditor.focus()
          })
        } else {
          const { message } = this
          try {
            this.message = message.trim()
              ? prettier.format(message, {
                  parser: 'json-stringify',
                  plugins: [prettierPlugins],
                })
              : '{}'
            session.editor = 'json'
          } catch (e) {
            this.$message.error('json格式不正确')
          }
        }
      },
      200,
      {
        leading: true,
        trailing: false,
      }
    ),
  },
}
</script>

<style lang="less" scoped>
.editor-box {
  height: 100%;
  position: relative;
  padding-top: 40px;
  box-sizing: border-box;
}

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
