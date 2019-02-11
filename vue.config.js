//
function getTemplateParameters() {
  if (process.env.NODE_ENV === 'production') {
    return {
      address: '<%= address %>',
      context: '<%= context %>',
    }
  }
  return {
    address: 'localhost:9080',
    context: '/debug',
  }
}

module.exports = {
  lintOnSave: false,
  devServer: {
    port: 9070,
  },
  pluginOptions: {
    preprocess: {
      moduleEntry: 'src/modules/*/*Main.vue',
      appUseRouter: false,
    },
    service: {
      html: {
        '.*': {
          templateParameters: getTemplateParameters(),
        },
      },
      copy: {
        'src/assets/img/favicon.ico': 'dist/img',
      },
    },
  },
}
