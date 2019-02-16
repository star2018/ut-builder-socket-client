<template>
  <el-dialog
    title="高级Mock"
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
        text-format="json"
        placeholder="请输入模板数据"
        :editor.sync="editor"
        v-model="code"
        :show-error-notify="false"
        locate-error-position
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
        v-model="mockScript"
        :show-collapse-button="false"
        :show-error-notify="false"
        @format-error="showError"
        format="js"
        editable
        locate-error-position
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
      <div class="button-bar">
        <el-button
          size="mini"
          :disabled="!scriptEditing"
          @click="$emit('show-history')"
          >脚本历史记录</el-button
        >

        <el-button
          size="mini"
          :class="{ active: scriptEditing }"
          :disabled="scriptEditing"
          @click="editScript()"
          >自定义脚本</el-button
        >

        <el-button size="mini" @click="pretty">格式化</el-button>

        <el-button
          size="mini"
          :class="{ active: !scriptEditing && editor === 'text' }"
          :disabled="!scriptEditing && editor === 'text'"
          @click="toggleEditor('text')"
          >JSON文本编辑</el-button
        >

        <el-button
          size="mini"
          :class="{ active: !scriptEditing && editor === 'json' }"
          :disabled="!scriptEditing && editor === 'json'"
          @click="toggleEditor('json')"
          >JSON可视编辑</el-button
        >

        <div class="timer-container">
          <div class="timer-box">
            <el-checkbox class="checker" v-model="timer.enabled" />
            <div class="timer-wrap" :class="{ disabled: !timer.enabled }">
              <span>间隔</span>
              <el-input-number
                size="mini"
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

      <div class="button-bar-right">
        <mocker-helper />

        <el-button size="mini" @click="visibility = false">取 消</el-button>

        <el-button
          size="mini"
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
import { mapState as globalMapState } from 'vuex'

import JSON5 from 'json5'
import throttle from 'lodash/throttle'
import cloneDeep from 'lodash/cloneDeep'
import uuid from 'uuid/v4'

import CodeEditor from '../../components/CodeEditor'
import CodePanel from '../../components/CodePanel'
import MockerHelper from './MockerHelper'

const defaultData = {
  code: '',
  mockScript: '',
  editor: 'text',
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
    MockerHelper,
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
      timer: {},
      ...cloneDeep(defaultData),
    }
  },

  computed: {
    ...globalMapState(['socket', 'session']),

    submittable() {
      const { scriptEditing, code, mockScript } = this
      if (scriptEditing) {
        return !!mockScript.trim()
      }
      return !!code.trim()
    },
  },

  watch: {
    visible(cur) {
      this.visibility = !!cur
    },

    visibility(visible) {
      this.$emit('update:visible', !!visible)
      if (visible) {
        const { session } = this
        this.style = this.getStyle()
        if (session && session.mocker) {
          const { script, delay } = session.mocker
          if (delay) {
            this.timer = {
              enabled: true,
              delay,
            }
          }
          this.editScript(script)
        } else {
          this.focus()
        }
      }
    },

    code() {
      this.setMockScript()
    },
  },

  methods: {
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
              if (this.visibility && !this.scriptEditing) {
                const { type, data, key } = Object.assign({}, message)
                if (type === 'message' && key === id) {
                  this.mockScript = data
                }
              }
            })
          }
        } catch (e) {
          if (!this.scriptEditing) {
            this.mockScript = ''
          }
        }
      },
      500,
      {
        leading: true,
        trailing: true,
      }
    ),

    getStyle() {
      return {
        width: Math.min(Math.max(window.innerWidth - 200, 1020), 1080) + 'px',
        height: Math.min(Math.max(window.innerHeight - 300, 300), 600) + 'px',
      }
    },

    createMocker() {
      const { timer } = this
      this.pretty(false)
      this.$nextTick(() => {
        if (!this.errorMessage.visible) {
          const script = (this.scriptEditing
            ? this.mockScript
            : this.wrapScript()
          ).trim()
          if (script) {
            this.$emit('create-mocker', {
              script,
              delay: timer.enabled ? +timer.delay : 0,
            })
            this.visibility = false
          } else {
            this.showError({ message: 'Mock脚本不能为空' })
          }
        }
      })
    },

    toggleEditor(editor) {
      const toggle = () => {
        this.scriptEditing = false
        this.editor = editor
        this.setMockScript()
        this.$nextTick(() => {
          this.pretty()
          this.focus()
        })
      }
      if (this.scriptEditing) {
        this.$confirm(
          '切换至JSON编辑器将导致已编辑的自定义脚本丢失，确定要切换吗？',
          '提示',
          {
            type: 'warning',
          }
        ).then(toggle, () => {
          this.focus()
        })
      } else {
        toggle()
      }
    },

    editScript(script) {
      if (this.scriptEditing) {
        return
      }
      this.scriptEditing = true
      this.mockScript = script || this.wrapScript()
      this.focus()
    },

    focus() {
      this.$nextTick(() => {
        const { codePanel, codeEditor } = this.$refs
        if (codeEditor) {
          codeEditor.focus()
        } else if (codePanel) {
          codePanel.focus()
        }
      })
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

    pretty(silent) {
      const codeEditor = this.$refs.codeEditor
      if (codeEditor) {
        codeEditor.pretty()
      }
      this.prettyScript(silent)
    },

    showError(error) {
      if (!error) {
        return
      }
      const { errorMessage, errorAlertCloseTimer } = this
      errorMessage.content =
        (typeof error === 'object' ? error.message : '') || `${error}`
      errorMessage.visible = true
      clearTimeout(errorAlertCloseTimer)
      this.errorAlertCloseTimer = setTimeout(() => {
        errorMessage.visible = false
      }, 5000)
    },

    wrapScript() {
      return `function main(data){return ${this.mockScript.trim() ||
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

  .button-bar {
    .active {
      color: #3a8ee6;
      border-color: #3a8ee6;
    }
  }

  .button-bar-right {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    line-height: 1em;
  }
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
      margin: 1px 8px 0 24px;
      line-height: 1em;
    }

    .input {
      width: 95px;
      margin: 0 4px;
    }

    .timer-wrap {
      &.disabled {
        color: #909399;
      }
    }
  }
}
</style>
