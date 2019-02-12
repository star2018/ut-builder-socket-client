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
        text-editor="code"
        placeholder="请输入模板数据"
        :editor.sync="editor"
        v-model="code"
        :show-error-notify="false"
        @format-error="showError"
        @resize="prettyScript"
      >
        <code-panel
          ref="codePanel"
          slot="previewer"
          :code="mockScript"
          :show-collapse-button="false"
          show-copy-button
        />
      </code-editor>

      <code-panel
        v-else
        ref="codePanel"
        editable
        v-model="mockScript"
        :show-collapse-button="false"
        :show-error-notify="false"
        @format-error="showError"
      />
      <transition name="el-zoom-in-bottom">
        <el-alert
          type="error"
          class="error-alert"
          v-show="errorMessage.visible"
          @close="errorMessage.visible = false"
        >
          <pre slot="title">{{ errorMessage.content }}</pre>
        </el-alert>
      </transition>
    </div>

    <div slot="footer" class="dialog-footer">
      <div>
        <el-button v-if="!scriptEditing" size="small" @click="editScript"
          >脚本模式</el-button
        >

        <el-button v-else size="small" @click="$emit('show-history')"
          >历史记录</el-button
        >

        <el-button
          size="small"
          class="bigger-button"
          v-if="!scriptEditing"
          @click="toggleEditor"
          >{{ editor === 'json' ? '文本模式' : 'JSON模式' }}</el-button
        >

        <el-button size="small" @click="pretty">格式化</el-button>

        <div class="timer-container">
          <div class="timer-box">
            <el-checkbox class="checker" v-model="timer.enabled" />
            <div class="timer-wrap" :class="{ disabled: !timer.enabled }">
              <span>间隔</span>
              <el-input-number
                size="small"
                :disabled="!timer.enabled"
                :min="1"
                :max="600"
                v-model="timer.delay"
                class="input"
              />
              <span>秒自动发送</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <el-button size="small" @click="visibility = false">取 消</el-button>
        <el-button
          size="small"
          type="primary"
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
import cloneDeep from 'lodash/cloneDeep'
import uuid from 'uuid/v4'

import CodeEditor from '../../components/CodeEditor'
import CodePanel from '../../components/CodePanel'

const defaultData = {
  code: '',
  mockScript: '',
  editor: 'text',
  submittable: false,
  scriptEditing: false,
  errorMessage: {
    visible: false,
    content: '',
  },
  timer: {
    enabled: false,
    delay: 5,
  },
}

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
      style: this.getStyle(),
      submittable: false,
      ...cloneDeep(defaultData),
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
        width: Math.min(Math.max(window.innerWidth - 350, 800), 1200) + 'px',
        height: Math.max(window.innerHeight - 300, 300) + 'px',
      }
    },

    createMocker() {
      const { timer } = this
      this.prettyScript(false)
      this.$nextTick(() => {
        if (!this.errorMessage.visible) {
          const script = this.scriptEditing
            ? this.mockScript
            : this.wrapScript()
          this.$emit('create-mocker', {
            script: this.$refs.codePanel.pretty(script, true),
            delay: timer.enabled ? +timer.delay : 0,
          })
          this.visibility = false
        }
      })
    },

    toggleEditor() {
      this.editor = this.editor === 'json' ? 'text' : 'json'
    },

    editScript() {
      this.scriptEditing = true
    },

    reset() {
      Object.assign(this, cloneDeep(defaultData))
      this.clearCreateMockerHandler()
    },

    clearCreateMockerHandler() {
      const { socket, createMockerHandler } = this
      if (socket && createMockerHandler) {
        socket.off('message', createMockerHandler)
        this.createMockerHandler = null
      }
    },

    prettyScript(silent) {
      this.mockScript = this.$refs.codePanel.pretty(
        this.mockScript,
        typeof silent === 'boolean' ? silent : !this.scriptEditing
      )
    },

    pretty() {
      const codeEditor = this.$refs.codeEditor
      if (codeEditor) {
        codeEditor.pretty()
      }
      this.prettyScript()
    },

    showHistory() {},

    showError(error) {
      if (!error) {
        return
      }
      const { errorMessage, errorAlertCloseTimer } = this
      errorMessage.content = error
      errorMessage.visible = true
      clearTimeout(errorAlertCloseTimer)
      this.errorAlertCloseTimer = setTimeout(() => {
        errorMessage.visible = false
      }, 5000)
    },

    wrapScript() {
      return `function Runner(data){return ${this.mockScript.trim() ||
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
        padding-left: 6px;
      }
    }
  }
  .el-dialog__footer {
    border: none;
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
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 2px;

  .code-editor {
    border: none;
  }

  .error-alert {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 5;
  }
}

.timer-container {
  display: inline-block;
  height: 100%;

  .timer-box {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

    .checker {
      margin: 0 8px 0 24px;
    }

    .input {
      width: 108px;
      margin: 0 4px;
    }

    .timer-wrap {
      &.disabled {
        color: #909399;
      }
    }
  }
}

.bigger-button {
  width: 90px;
}
</style>
