<template>
  <ul class="list">
    <li v-for="item of messages" :key="item.key">
      {{ item.content }}
    </li>
  </ul>
</template>

<script>
export default {
  name: 'MessageList',
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
  },
}
</script>

<style lang="less" scoped>
.list {
  overflow-y: auto;
  margin: 0;
  padding: 8px 16px;
  box-sizing: border-box;
  list-style: none;
}
</style>
