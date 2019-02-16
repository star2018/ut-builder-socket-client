<template>
  <div ref="lazyList" class="lazy-list" @scroll="handleScroll">
    <div class="content">
      <div v-for="item of slicedList" :key="item[keyProp]">
        <slot :item="item" />
      </div>
    </div>
  </div>
</template>

<script>
import uuid from 'uuid/v4'

import {
  scrollElementToBottom,
  setElementScrollPosition,
} from '../utils/scroll'

export default {
  name: 'LazyList',
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    keyProp: {
      type: String,
      default: 'key',
    },
    threshold: {
      type: Number,
      default: 5,
    },
    reverse: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      piece: 1,
    }
  },

  computed: {
    slicedList() {
      const { data, keyProp, threshold, piece, reverse } = this
      const hasProperty = Object.prototype.hasOwnProperty
      const list = reverse
        ? data.slice(-piece * threshold)
        : data.slice(0, piece * threshold)
      //
      for (const item of list) {
        if (!hasProperty.call(item, keyProp)) {
          item[keyProp] = uuid()
        }
      }
      return list
    },
  },

  watch: {
    data(cur, pre) {
      if (cur !== pre) {
        this.reset()
      }
    },
    keyProp() {
      this.reset()
    },
    threshold() {
      this.reset()
    },
    reverse() {
      this.reset()
    },
  },

  mounted() {
    if (this.reverse) {
      this.scrollToBottom()
    }
    this.appendForScrollable()
  },

  methods: {
    handleScroll(event) {
      const target = event.target
      const { reverse, lastScrollTop } = this
      const scrollTop = target.scrollTop
      this.lastScrollTop = scrollTop
      let reached = false
      if (reverse) {
        if (scrollTop === 0) {
          reached = true
        } else if (scrollTop < lastScrollTop && scrollTop < 50) {
          reached = true
        }
      } else {
        const clientHeight = target.clientHeight
        const scrollHeight = target.scrollHeight
        if (scrollTop + clientHeight === scrollHeight) {
          reached = true
        } else if (
          scrollTop > lastScrollTop &&
          Math.abs(scrollHeight - (scrollTop + clientHeight)) < 50
        ) {
          reached = true
        }
      }
      if (reached) {
        this.appendMore()
      }
    },

    hasScrollBar(target) {
      target = target || this.$refs.lazyList
      return target ? target.scrollHeight > target.clientHeight : false
    },

    appendMore() {
      const { slicedList, data } = this
      if (slicedList.length < data.length) {
        this.piece++
      }
    },

    appendForScrollable() {
      const { slicedList, data } = this
      if (slicedList.length < data.length) {
        if (!this.hasScrollBar()) {
          this.piece++
          this.$nextTick(() => {
            if (this.reverse) {
              this.scrollToBottom()
            }
            this.appendForScrollable()
          })
        }
      }
    },

    reset() {
      this.piece = 1
      this.$nextTick(() => {
        if (!this.reverse) {
          this.scrollToTop()
        }
        this.appendForScrollable()
      })
    },

    scrollToTop() {
      this.scrollTo(0)
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const root = this.$refs.lazyList
        if (root) {
          scrollElementToBottom(root, true)
        }
      })
    },

    scrollToBottomLazy(throttle) {
      const root = this.$refs.lazyList
      if (root) {
        const scrollHeight = root.scrollHeight
        const space = Math.abs(
          scrollHeight - (root.scrollTop + root.clientHeight)
        )
        this.$nextTick(() => {
          if (space <= (+throttle || 0)) {
            scrollElementToBottom(root, true)
          } else {
            root.scrollTop = scrollHeight - root.clientHeight - space
          }
        })
      }
    },

    scrollTo(position) {
      this.$nextTick(() => {
        const root = this.$refs.lazyList
        if (root) {
          setElementScrollPosition(root, { top: position })
        }
      })
    },
  },
}
</script>

<style lang="less" scoped>
.lazy-list {
  overflow: auto;
  height: 100%;

  .content {
    overflow: visible;

    &:after {
      content: '';
      width: 0;
      height: 0;
      display: block;
      clear: both;
    }
  }
}
</style>
