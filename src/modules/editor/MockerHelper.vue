<template>
  <el-popover placement="top">
    <i slot="reference" title="帮助" class="iconfont icon-question"></i>
    <div class="helper">
      <div class="title"><span class="code">JSON</span>文本编辑</div>
      <div class="description">
        普通的<span class="code">JSON</span>文本编辑模式，输入内容将作为<span
          class="code"
          >JSON</span
        >格式解析，并自动根据输入内容生成相应的<span class="code">Mock</span
        >脚本。
      </div>
      <div class="title"><span class="code">JSON</span>可视编辑</div>
      <div class="description">
        可视化的<span class="code">JSON</span>编辑器模式，可直观地对<span
          class="code"
          >JSON</span
        >对象进行编辑。输入的数据也将自动转换为相应的<span class="code"
          >Mock</span
        >脚本。
      </div>
      <div class="title">自定义脚本</div>
      <div class="description">
        <span
          >代码编辑器模式，可自由地定义<span class="code">Mock</span
          >数据生成逻辑。</span
        ><span
          ><span class="code">Mock</span
          >脚本将在一个受限的沙盒环境中运行，且顶层作用域中声明的<span
            class="code"
            >main</span
          >函数将作为<span class="code">Mock</span>数据生成函数被调用。</span
        >
      </div>
      <div class="title">执行环境</div>
      <div class="description">
        <span
          >执行环境中包含一个<span class="code">Mock</span
          >全局变量，可用来辅助生成<span class="code">Mock</span>数据。</span
        ><br /><span
          >相应用法请参考<a
            href="http://mockjs.com/"
            title="MockJS"
            target="_blank"
            ><span class="code">mockjs</span></a
          >官方文档。</span
        >
      </div>
      <div class="title">自动发送</div>
      <div class="description">
        <span
          >可定义一个时间间隔，周期性地调用<span class="code">Mock</span
          >脚本，生成数据并发往服务器。</span
        >
        <span
          >非定时发送情况下，<span class="code">main</span>函数将接受一个<span
            class="code"
            >data</span
          >参数，其值为从服务器收到的最近一条消息的内容。</span
        >
      </div>
    </div>
  </el-popover>
</template>

<script>
export default {
  name: 'mocker-helper',
}
</script>

<style lang="less" scoped>
.icon-question {
  margin-right: 10px;
  cursor: pointer;
  color: #606266;
  line-height: 1em;
}

.helper {
  max-width: 480px;
  padding: 8px;
}

.title {
  font-size: 14px;
  line-height: 22px;
  color: #606266;
  margin: 8px 0 2px;

  &:first-of-type {
    margin-top: 0;
  }
}

.description {
  font-size: 12px;
  line-height: 20px;
  color: #909399;
}

.code {
  margin: 0 2px;
}

a {
  color: #409eff;
  .code {
    color: #409eff;
    cursor: pointer;
  }
}
</style>
