<template>
  <el-dialog
    title="Mock定义"
    class="mocker-define-dialog"
    :visible.sync="visibility"
    :close-on-click-modal="false"
    :width="style.width"
    @closed="reset"
  >
    <div
      class="editor-wrap"
      :class="{ editing: scriptEditing }"
      :style="{ height: style.height }"
    >
      <code-editor
        v-if="!scriptEditing"
        class="code-editor"
        ref="codeEditor"
        :editor.sync="editor"
        placeholder="请输入模板数据"
        v-model="code"
        @resize="prettyScript"
      >
        <code-panel
          ref="codePanel"
          slot="previewer"
          :code="mockScript"
          :show-collapse-button="false"
        />
      </code-editor>

      <code-panel
        v-else
        ref="codePanel"
        editable
        v-model="mockScript"
        :show-collapse-button="false"
      />
    </div>

    <div slot="footer" class="dialog-footer">
      <div>
        <el-button :disabled="scriptEditing" @click="editScript"
          >脚本模式</el-button
        >
        <el-button :disabled="scriptEditing" @click="toggleEditor">{{
          editor === 'json' ? '文本模式' : 'JSON模式'
        }}</el-button>
        <el-button @click="pretty">格式化</el-button>
        <el-button @click="pretty">历史记录</el-button>
      </div>
      <div>
        <el-button @click="visibility = false">取 消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!submittable"
          @click="createMocker"
          >开启Mock</el-button
        >
      </div>
    </div>
  </el-dialog>
</template>

<script>
import {
  mapState as globalMapState,
  mapActions as globalMapActions,
} from 'vuex'

import JSON5 from 'json5'
import throttle from 'lodash/throttle'
import uuid from 'uuid/v4'

import CodeEditor from '../../components/CodeEditor'
import CodePanel from '../../components/CodePanel'

export default {
  name: 'MockerDialog',
  components: {
    CodePanel,
    CodeEditor,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      visibility: this.$props.visible,
      code: '',
      mockScript: '',
      editor: 'text',
      submitting: false,
      submittable: false,
      scriptEditing: false,
      style: this.getStyle(),
    }
  },

  computed: {
    ...globalMapState(['socket', 'session']),
  },

  watch: {
    visible(cur) {
      this.visibility = !!cur
    },

    visibility(visible) {
      this.$emit('update:visible', !!visible)
      if (visible) {
        this.style = this.getStyle()
        this.$nextTick(() => {
          this.$refs.codeEditor.focus()
        })
      }
    },

    code() {
      this.setMockScript()
    },

    mockScript(cur) {
      if (!cur.trim()) {
        this.submittable = false
      } else if (this.scriptEditing) {
        this.submittable = true
      }
    },

    scriptEditing(cur) {
      if (cur) {
        this.mockScript = this.wrapScript()
      }
    },
  },

  methods: {
    ...globalMapActions(['send']),

    setMockScript: throttle(
      function() {
        const { visibility, socket, session, code } = this
        try {
          if (visibility && socket && session) {
            const data = JSON5.parse(code)
            const id = uuid()
            socket.send({
              type: 'message',
              call: 'mock-convert',
              token: session.token,
              data,
              key: id,
            })
            socket.once('message', (message) => {
              if (this.visibility) {
                const { type, data, key } = Object.assign({}, message)
                if (type === 'message' && key === id) {
                  this.mockScript = data
                  if (data) {
                    this.submittable = true
                  }
                }
              }
            })
          }
        } catch (e) {
          this.submittable = false
          //
        }
      },
      200,
      {
        leading: false,
        trailing: true,
      }
    ),

    getStyle() {
      return {
        width: Math.max(window.innerWidth - 350, 700) + 'px',
        height: Math.max(window.innerHeight - 300, 300) + 'px',
      }
    },

    createMocker() {
      const script = this.scriptEditing ? this.mockScript : this.wrapScript()
      const { socket, session } = this
      if (socket && session) {
        this.submitting = true
        const id = uuid()
        socket.send({
          type: 'message',
          call: 'mock-define',
          token: session.token,
          data: script,
          key: id,
        })
        socket.on(
          'message',
          (this.createMockerHandler = (message) => {
            if (this.visibility) {
              const { type, data, key } = Object.assign({}, message)
              if (type === 'message' && key === id) {
                if (data) {
                  this.setHistory(script)
                  this.$emit('mock-created', {
                    id: data,
                  })
                }
                this.visibility = false
              }
            }
          })
        )
      }
    },

    setHistory(content) {},

    toggleEditor() {
      this.editor = this.editor === 'json' ? 'text' : 'json'
    },

    editScript() {
      this.$confirm(
        '切换成脚本模式后，将不能再次切换成JSON模式，确定要切换吗？',
        '脚本模式',
        {
          type: 'warning',
        }
      ).then(
        () => {
          this.scriptEditing = true
        },
        () => {}
      )
    },

    reset() {
      this.code = ''
      this.mockScript = ''
      this.editor = 'text'
      this.submitting = false
      this.submittable = false
      this.scriptEditing = false
      this.clearCreateMockerHandler()
    },

    clearCreateMockerHandler() {
      const { socket, createMockerHandler } = this
      if (socket && createMockerHandler) {
        socket.off('message', createMockerHandler)
        this.createMockerHandler = null
      }
    },

    prettyScript() {
      this.mockScript = this.$refs.codePanel.pretty(
        this.mockScript,
        !this.scriptEditing
      )
    },

    pretty() {
      const codeEditor = this.$refs.codeEditor
      if (codeEditor) {
        codeEditor.pretty()
      }
      this.prettyScript()
    },

    wrapScript() {
      return `import Mock from 'mockjs';export default ()=>{return ${this.mockScript.trim() ||
        'Mock.mock({})'}}`
    },
  },
}
</script>

<style lang="less">
.mocker-define-dialog {
  .el-dialog__body {
    padding: 4px 20px 0 20px;
    .code-editor {
      .text-editor {
        padding-left: 0;
      }
      .json-editor-container {
        padding-left: 0;
      }
    }
  }
  .el-dialog__footer {
    border-top: 1px solid #e4e7ed;
    margin: 0 20px;
    padding: 20px 0;
  }
}
</style>

<style lang="less" scoped>
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-wrap {
  &.editing {
    border: 1px solid #e4e7ed;
    border-bottom: none;
  }
}
</style>
