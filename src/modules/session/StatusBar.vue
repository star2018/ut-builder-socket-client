<template>
  <div class="status-bar">
    <template v-if="session">
      <div class="info-bar">
        <span
          class="connect-state"
          :class="{ disconnected }"
          :title="disconnected ? '已断开' : '已连接'"
        ></span>
        <span class="duration">{{ duration }}</span>
      </div>
      <div class="title-bar">
        <span class="title">{{ session.title }}</span>
      </div>
      <div class="button-bar">
        <i
          class="iconfont icon-close"
          title="关闭"
          @click="$emit('remove-session')"
        ></i>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'StatusBar',
  props: {
    session: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      duration: '',
    }
  },

  computed: {
    disconnected() {
      const { session } = this
      return session ? session.disconnected : true
    },
  },

  watch: {
    session(cur) {
      if (!cur) {
        this.clearTimer()
      } else {
        this.setTimer()
      }
    },

    disconnected(cur) {
      if (cur) {
        this.clearTimer()
      } else {
        this.setTimer()
      }
    },
  },

  created() {
    const { session } = this
    if (session && !session.disconnected) {
      this.setTimer()
    }
  },

  beforeDestroy() {
    this.clearTimer()
  },

  methods: {
    setTimer() {
      this.clearTimer()
      this.timer = setInterval(() => {
        this.duration = this.getDuration()
      }, 1000)
    },

    clearTimer() {
      clearInterval(this.timer)
      if (this.session) {
        this.duration = this.getDuration()
      }
    },

    getDuration() {
      const { session } = this
      if (session) {
        const { timestamp, closeTimestamp } = session
        const duration = (closeTimestamp || Date.now()) - timestamp
        const hours = Math.floor(duration / (60 * 60 * 1000))
        const minutes = Math.floor((duration % (60 * 60 * 1000)) / (60 * 1000))
        const seconds = Math.floor(
          (duration - hours * 60 * 60 * 1000 - minutes * 60 * 1000) / 1000
        )
        return `${
          hours ? `${hours}`.padStart(2, '0') + ':' : ''
        }${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`
      }
      return ''
    },
  },
}
</script>

<style lang="less" scoped>
.status-bar {
  height: 50px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  border-bottom: 1px solid #dcdfe6;
  box-sizing: border-box;
}

.info-bar {
  flex: none;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  box-sizing: border-box;
}

.connect-state {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-color: #00e600;
  border-radius: 50%;
  margin: 0 16px 0 4px;
  box-shadow: 0 0 8px 2px rgba(#00e600, 0.8);
  transition: background-color 1s, box-shadow 1s;

  &.disconnected {
    background-color: #a8a8a8;
    box-shadow: 0 0 2px 2px rgba(#a8a8a8, 0.5);
  }
}

.button-bar {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  margin-left: 8px;

  .iconfont {
    cursor: pointer;
    font-size: 26px;
    color: #606266;
    margin-left: 12px;

    &:hover {
      color: #303133;
    }
  }

  .duration {
    margin-right: 4px;
  }
}

.title-bar {
  flex: 1 1 auto;
  height: 100%;
  text-align: center;
  flex-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 700;

  .title {
    display: inline-block;
    vertical-align: middle;
  }

  &:before {
    content: '';
    display: inline-block;
    vertical-align: middle;
    width: 0;
    height: 100%;
  }
}

.info-bar,
.button-bar {
  min-width: 120px;
}
</style>
