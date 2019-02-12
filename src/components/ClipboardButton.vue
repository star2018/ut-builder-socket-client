<template>
  <span
    class="tooltipped-no-delay clipboard-button-copy"
    :class="{ [`tooltipped-${position}`]: true }"
    :aria-label="tooltip"
    :data-clipboard-text="text"
    data-clipboard-action="copy"
  >
    <i class="iconfont" :class="{ [icon]: true }" :title="title"></i>
  </span>
</template>

<script>
import ClipboardJS from 'clipboard'

new ClipboardJS('.clipboard-button-copy').on('success', (event) => {
  const { trigger } = event
  const className = 'tooltipped'
  clearTimeout(trigger.tooltipTimer)
  trigger.classList.add(className)
  trigger.tooltipTimer = setTimeout(() => {
    trigger.classList.remove(className)
  }, 3000)
})

export default {
  name: 'ClipboardButton',
  props: {
    tooltip: {
      type: String,
      default: 'Copied!',
    },
    title: {
      type: String,
      default: '拷贝',
    },
    text: {
      type: [String, Boolean, Number],
      default: '',
    },
    icon: {
      type: String,
      default: 'icon-copy',
    },
    position: {
      type: String,
      validator(value) {
        return /^[nwes]$/.test(value)
      },
      default: 'w',
    },
  },
}
</script>

<style lang="less" scoped>
@import '~primer-tooltips/build/build.css';

.clipboard-button-copy {
  cursor: pointer;
}
</style>
