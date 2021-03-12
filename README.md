# coa-http

COA核心HTTP库

## 特点

- **API而生** 专为API开发使用
- **轻量极简** 不到10K、不依赖第三方库、不过度封装
- **灵活** 支持微服务、Serverless模式、Context可自由扩展
- **文档友好** 自动生成接口文档、自动生成前端接口代码
- **TypeScript** 全部使用TypeScript书写，类型约束、IDE友好

## 参考

- 受 [koa](https://www.npmjs.com/package/koa) 启发，完善Context生成机制
- 受 [koa-router](https://www.npmjs.com/package/koa-router) 启发，完善路由生成机制
- 受 [koa-bodyparser](https://www.npmjs.com/package/koa-bodyparser) 启发，完善请求体处理机制
- 受 [egg]() 启发，完善Context扩展机制
- 以 [swagger-ui]() 为基础，完成接口文档的自动生成

## 迭代

- 第一版 [coajs](https://www.npmjs.com/package/coajs) ，于2019年发布的第一个版本，本身属于第三方类库的整合。从多个线上项目中抽离出来，以方便部署更新为目的作为单独的库。随着不断迭代，添加的东西越来越多，coajs越来越臃肿，已经不适合轻量级小项目使用。迭代114个版本后停止维护

- 第二版 [coa-serve](https://www.npmjs.com/package/coa-serve) ，针对第一版出现的臃肿问题，基于`coajs`实现方式将其化整为零，分别将基础组件和核心组件抽离为单独的库，并将其**开源**，同时优化了文档生成机制、路由检索、系统环境配置等机制。目前已经稳定，线上所有的coajs项目均已经迁移到coa-serve来

- 第三版 `coa-http`，也就是目前的版本。随着不断迭代，接口对外提供服务的方式已经不限于http了，将tcp、websocket等服务直接整合到`coa-serve`中并不优雅。此外，~~随着笔者的认知进步，~~`koa`全家桶也并不是最优的选择。故计划将`coa-serve`拆解，分别重构为 `coa-http`、`coa-tcp`、`coa-ws`。本版本正是重构的`coa-http`，目前仍在初步阶段，线上仅部分后台管理相关模块接口从`coa-serve`迁移过来

## 快速开始

### 安装

```shell
mkdir <project-name>
cd <project-name>

yarn add coa-http
yarn add typescript tsc-watch @types/node -D
```

### 创建文件

```shell
mkdir service 
mkdir gateway
mkdir gateway/debug

touch service/index.ts
touch gateway/index.ts
touch gateway/debug/test.ts

touch tsconfig.json
```

在 `gateway/index.ts` 中写入代码

```typescript
import { CoaContext, CoaHttp } from 'coa-http'

export const http = new CoaHttp(CoaContext)

http.start().then(() => {
  // 做一些启动后的事情
})
```

在 `gateway/debug/test.ts` 中写入代码

```typescript
import { http } from '..'

http.register('调试', {

  '/debug/test/hello': {
    options: {
      method: 'GET',
      name: '你好世界'
    },
    async handler () {
      return { result: 'hello,world!' }
    }
  },
})
```

在 `tsconfig.json` 中写入配置

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "CommonJS",
    "target": "ESNext",
    "baseUrl": ".",
    "outDir": "node_run",
    "sourceMap": true
  },
  "include": [
    "gateway",
    "service"
  ]
}
```

在 `package.json` 文件的 `scripts` 节点中加入`dev`

```json
{
  "scripts": {
    "dev": "HOST=3000 NODE_PATH=node_run tsc-watch --onSuccess 'node node_run/gateway'"
  }
}

```

### 启动
```shell
yarn dev
```
看到类似下面的运行结果，说明启动成功
```text
Found 0 errors. Watching for file changes.
[server] Booting...
[server] Startup successful in: 5.399953 ms
[server] Listening on: http://localhost:3000/gw/doc
```
此时使用浏览器打开 `http://localhost:3000/gw/doc` 可以直接打开接口文档