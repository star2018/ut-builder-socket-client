<template>
  <lazy-list
    ref="messageList"
    class="message-list"
    key-prop="key"
    reverse
    :data="messages"
  >
    <div
      class="item"
      slot-scope="{ item }"
      :class="{ collapsed: item.collapsed }"
    >
      <div v-if="item.from === 'state'" class="state">
        <div class="content">
          <span>{{ item.content }}</span>
        </div>
      </div>

      <div v-else :class="{ [item.from]: true, code: item.type === 'json' }">
        <i class="avatar">{{ item.from === 'client' ? 'M' : 'S' }}</i>

        <div class="content">
          <code-panel
            v-if="item.type === 'json'"
            class="code-panel"
            :class="{ hover: item.hovered }"
            :code="item.content"
            :show-collapse-button="false"
            :collapsed.sync="item.collapsed"
            :collapsible.sync="item.collapsible"
            @mouseenter.native="item.hovered = true"
            @mouseleave.native="item.hovered = false"
          />

          <span v-else>{{ item.content }}</span>

          <div class="status">
            <i
              v-if="!item.success"
              :title="item.from === 'server' ? '接收失败' : '发送失败'"
              class="iconfont icon-tips"
            ></i>
            <i
              v-if="item.collapsible"
              class="iconfont"
              :title="item.collapsed ? '展开' : '折叠'"
              :class="{
                'icon-expand': item.collapsed,
                'icon-collapse': !item.collapsed,
              }"
              @click="item.collapsed = !item.collapsed"
            ></i>
          </div>
        </div>
      </div>
    </div>
  </lazy-list>
</template>

<script>
import CodePanel from '../../components/CodePanel'
import LazyList from '../../components/LazyList'

export default {
  name: 'MessageList',
  components: { LazyList, CodePanel },
  props: {
    session: {
      type: Object,
      default: null,
    },
  },

  computed: {
    messages() {
      const { session } = this
      return session ? session.messages : []
    },

    mocking() {
      const { session } = this
      return session && session.mocker ? !!session.mocker.enabled : false
    },
  },

  watch: {
    messages() {
      const messageList = this.$refs.messageList
      if (!this.mocking) {
        messageList.scrollToBottom()
      } else {
        messageList.scrollToBottomLazy()
      }
    },
  },
}
</script>

<style lang="less">
.message-list {
  .server,
  .client {
    .code-panel {
      &.hover {
        .button-bar {
          display: block;
        }
      }

      .button-bar {
        padding-right: 8px;
        display: none;
      }

      .code-wrap,
      .button-bar {
        background-color: #fff;
      }
    }
  }

  .item {
    &.collapsed {
      .code-panel {
        .code-wrap {
          &:after {
            background-color: #fff;
          }
        }
      }
    }
  }
}
</style>

<style lang="less" scoped>
.message-list {
  padding: 16px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: visible;

  .item {
    .code-panel {
      z-index: 1;
    }

    &:after {
      content: '';
      display: block;
      width: 0;
      height: 0;
      clear: both;
    }
  }
}

.state {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  float: left;
  width: 100%;

  .content {
    background-color: #ddd;
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    vertical-align: middle;
  }
}

.server,
.client {
  position: relative;
  max-width: 60%;
  float: left;
  padding: 0 0 0 52px;
  min-width: 160px;
  margin-bottom: 16px;
  min-height: 48px;

  .avatar {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    z-index: 1;
    background-color: #c0c4cc;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 0;
    top: 4px;
    font-size: 16px;
  }

  .content {
    position: relative;
    font-size: 14px;
    word-break: break-all;
    padding: 12px 8px;
    background-color: #fff;
    border-radius: 6px;
    line-height: 1.382em;
    min-height: 48px;
    box-sizing: border-box;
    display: flex;
    align-items: center;

    &:before {
      content: '';
      position: absolute;
      left: -14px;
      top: 16px;
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border: 8px solid transparent;
      border-right-color: #fff;
    }

    .status {
      position: absolute;
      right: -20px;
      top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-around;
      height: 48px;

      .iconfont {
        line-height: 1em;
        font-size: 16px;
        margin: 2px 0;
      }

      .icon-tips {
        color: #ff0000;
      }

      .icon-expand,
      .icon-collapse {
        cursor: pointer;
        color: #666;

        &:hover {
          color: #000;
        }
      }
    }
  }
}

.client {
  float: right;
  padding: 0 52px 0 0;

  .avatar {
    left: auto;
    right: 0;
  }

  .content {
    background-color: #92e648;

    &:before {
      left: auto;
      right: -14px;
      border-right-color: transparent;
      border-left-color: #92e648;
    }

    .status {
      right: auto;
      left: -20px;
    }
  }
}

.server,
.client {
  &.code {
    .content {
      padding: 0;
      background-color: #fff;

      .code-panel {
        overflow: auto;
        border-radius: 6px;
        max-height: 400px;
      }
    }
  }
}

.client {
  &.code {
    .content {
      &:before {
        border-left-color: #fff;
      }
    }
  }
}
</style>
