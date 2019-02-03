<template>
  <div class="editor-box">
    <div class="toolbar">
      <i
        class="iconfont icon-json"
        :class="{ 'state-enabled': jsonEditor }"
        title="json编辑模式"
        @click="jsonEdit"
      ></i>
      <i class="iconfont icon-format" title="格式化" @click="jsonPretty"></i>
      <div v-if="!session" class="toolbar-mask"></div>
    </div>

    <split-panels v-if="editor === 'json'" class="json-editor-wrap" watch-slots>
      <div
        class="json-editor-scroll"
        splitpanes-default="60"
        splitpanes-min="20"
        splitpanes-max="80"
      >
        <div
          class="json-editor"
          :key="jsonEditorKey"
          ref="jsonEditorContainer"
        ></div>
      </div>

      <div class="json-code json-editor-scroll" splitpanes-default="40">
        <pre ref="jsonCode" class="highlight-code" v-html="messageCode"></pre>
      </div>
    </split-panels>

    <div v-else class="text-editor-wrap">
      <textarea
        class="text-editor"
        ref="textarea"
        placeholder="按 Ctrl + Enter 发送"
        @keyup.ctrl.enter="commit"
        v-model="message"
        :class="{ disabled }"
        :disabled="disabled"
      ></textarea>
    </div>
  </div>
</template>

<script>
import {
  mapState as globalMapState,
  mapActions as globalMapActions,
} from 'vuex'

import prettier from 'prettier/standalone'
import prettierPlugins from 'prettier/parser-babylon'
import JsonEditor from 'json-view'
import highlight from 'highlight.js'
import SplitPanels from 'splitpanes'
import uuid from 'uuid/v4'

export default {
  name: 'EditorPanel',
  components: { SplitPanels },
  data() {
    return {
      message: '',
      messageCode: '',
      jsonEditor: null,
      jsonEditorKey: uuid(),
    }
  },
  watch: {
    message(cur) {
      const { session } = this
      if (session) {
        session.message = cur
      }
      this.messageCode = cur
        .split(/(?:\r)?\n/g)
        .map((code) => `<code>${code}</code>`)
        .join('<br/>')
    },

    disabled(cur) {
      if (cur) {
        this.message = ''
      }
    },

    session(cur) {
      this.destroyJsonEditor()
      if (cur) {
        this.message = cur.message || ''
        if (cur.editor === 'json') {
          this.jsonEdit()
        }
      } else {
        this.message = ''
      }
    },
  },

  computed: {
    ...globalMapState(['session']),
    //
    disabled() {
      const { session } = this
      return !session
    },
    editor() {
      const { session } = this
      return (session ? session.editor : '') || 'text'
    },
  },
  methods: {
    ...globalMapActions(['send']),
    //
    async commit() {
      await this.send(this.message)
      this.message = ''
    },

    jsonPretty(type) {
      try {
        const editor = this.editor === 'text' ? 'textarea' : 'jsonCode'
        this.message = prettier.format(this.message, {
          parser: type === 'json' ? type : 'json5',
          plugins: [prettierPlugins],
          printWidth: Math.floor(this.$refs[editor].offsetWidth / 14),
        })
      } catch (e) {
        this.$message.error('json格式不正确')
      }
    },

    jsonEdit() {
      if (this.jsonEditor) {
        this.destroyJsonEditor()
        this.session.editor = 'text'
        this.$nextTick(() => {
          this.jsonPretty()
          this.$refs.textarea.focus()
        })
        return
      }
      try {
        const message = this.message
        let obj = {}
        if (typeof message === 'string' && message.trim()) {
          const json = prettier.format(message, {
            parser: 'json-stringify',
            plugins: [prettierPlugins],
          })
          obj = JSON.parse(json)
        } else {
          this.message = '{}'
        }
        this.session.editor = 'json'
        this.destroyJsonEditor()
        //
        this.$nextTick(() => {
          const editor = new JsonEditor(obj)
          this.jsonEditor = editor
          editor.expand(true)
          this.$refs.jsonEditorContainer.appendChild(editor.dom)
          //
          editor.on('change', () => {
            this.message = JSON.stringify(editor.value)
            this.jsonPretty('json')
            //
            this.$nextTick(() => {
              highlight.highlightBlock(this.$refs.jsonCode)
            })
          })
          //
          editor.emit('change')
        })
      } catch (e) {
        this.$message.error('json格式不正确')
      }
    },

    destroyJsonEditor() {
      if (this.jsonEditor) {
        this.jsonEditor.destroy()
        this.jsonEditor = null
        this.jsonEditorKey = uuid()
      }
    },
  },
}
</script>

<style lang="less">
.editor-box {
  .splitpanes--vertical {
    .splitpanes__splitter {
      &:before {
        position: absolute;
        content: '';
        left: -4px;
        width: 8px;
        top: 0;
        height: 100%;
        z-index: 1;
      }
    }
  }
}
</style>

<style lang="less" scoped>
@import '~json-view/devtools.css';
@import '~highlight.js/styles/default.css';

.editor-box {
  height: 100%;
  position: relative;
  padding-top: 40px;
  box-sizing: border-box;
}

.toolbar {
  width: 100%;
  height: 40px;
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
    margin-right: 12px;
    color: #666;
    cursor: pointer;

    &:hover {
      color: #000;
    }

    &.state-enabled {
      color: #00e600;
    }
  }
}

.toolbar-mask {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.json-editor-wrap {
  width: 100%;
  height: 100%;
  border-top: 1px solid #e2e2e2;
}

.json-editor-scroll {
  overflow: auto;
  height: 100%;
  width: 100%;
}

.json-editor {
  padding: 16px 80px 80px 16px;
  box-sizing: border-box;
  &:after {
    content: '';
    display: block;
    width: 0;
    height: 0;
    clear: both;
  }
}

.highlight-code {
  margin: 0;
}

.text-editor-wrap {
  padding: 8px 0 16px 16px;
  width: 100%;
  height: 100%;
}

.text-editor {
  outline: none;
  box-sizing: border-box;
  padding: 0;
  resize: none;
  border: none;
  font-size: 14px;
  width: 100%;
  height: 100%;

  &.disabled {
    cursor: not-allowed;
  }
}
</style>
