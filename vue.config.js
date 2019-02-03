module.exports = {
  lintOnSave: false,
  pluginOptions: {
    preprocess: {
      moduleEntry: 'src/modules/*/*Main.vue',
      appUseRouter: false,
    },
    service: {
      html: {
        '.*': {
          // 兼容模板参数
          templateParameters: {
            address: '192.168.1.109:9080',
            context: '/debug',
          },
        },
      },
    },
  },
}
