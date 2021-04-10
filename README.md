# coa-http

[![GitHub license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![npm version](https://img.shields.io/npm/v/coa-http.svg?style=flat-square)](https://www.npmjs.org/package/coa-http)
[![npm downloads](https://img.shields.io/npm/dm/coa-http.svg?style=flat-square)](http://npm-stat.com/charts.html?package=coa-http)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/coajs/coa-http/pulls)

一个简单、快速、轻量的HTTP服务框架，专为API而生，是COA核心HTTP库

## 特性

- **API而生** 专为API开发使用，不支持页面的渲染
- **轻量极简** 不到10K、不依赖第三方库、不过度封装
- **模式灵活** 支持微服务、Serverless模式、Context可自由扩展
- **文档友好** 自动生成接口文档、自动生成前端接口代码
- **TypeScript** 全部使用TypeScript编写，类型约束、IDE友好
- **Deno** 支持在Deno下运行（todo，计划6月份完成）

## 参考

- 受 [koa](https://www.npmjs.com/package/koa) 启发，完善Context生成机制
- 受 [koa-router](https://www.npmjs.com/package/koa-router) 启发，完善路由生成机制
- 受 [koa-bodyparser](https://www.npmjs.com/package/koa-bodyparser) 启发，完善请求体处理机制
- 受 [egg](https://eggjs.org/zh-cn) 启发，完善Context扩展机制
- 以 [swagger-ui](https://swagger.io/tools/swagger-ui) 为基础，完成接口文档的自动生成

## 迭代

- 第一版 [coajs](https://www.npmjs.com/package/coajs) ，于2019年发布的第一个版本，本身属于第三方类库的整合。从多个线上项目中抽离出来，以方便部署更新为目的作为单独的库。随着不断迭代，添加的东西越来越多，`coajs`越来越臃肿，已经不适合轻量级小项目使用。迭代114个版本后停止维护

- 第二版 [coa-serve](https://www.npmjs.com/package/coa-serve) ，针对第一版出现的臃肿问题，基于`coajs`实现方式将其化整为零，分别将基础组件和核心组件抽离为单独的库，并将其**开源**，同时优化了文档生成机制、路由检索、系统环境配置等机制。目前已经稳定，线上所有的coajs项目均已经迁移到coa-serve来

- 第三版 [coa-http](https://www.npmjs.com/package/coa-http)，也就是目前的版本。随着不断迭代，接口对外提供服务的方式已经不限于`http`了，将`tcp`、`websocket`等服务直接整合到`coa-serve`中并不优雅。此外，~~随着笔者的认知进步~~，`koa`全家桶也并不是最优的选择。故计划将`coa-serve`拆解，分别重构为 [coa-http](https://www.npmjs.com/package/coa-http)、[coa-tcp](https://www.npmjs.com/package/coa-tcp)、[coa-websocket](https://www.npmjs.com/package/coa-websocket) 等。本版本正是重构的`coa-http`，目前仍在初步阶段，实际生产项目仅部分后台管理相关模块接口从`coa-serve`迁移过来

## 快速开始

### 环境安装

请确保在操作系统上安装了最新稳定版的 [Node.js](https://nodejs.org) 。

### 新建项目

```shell
mkdir <project-name>
cd <project-name>

yarn add coa-http
yarn add typescript tsc-watch @types/node -D
```

### 创建文件

```shell
gateway            #网关层
├─ index.ts        #网关入口
├─ debug           #其中一个模块
│  └─ test.ts      #模块下具体路由的实现
service            #服务层
├─ index.ts        #具体服务的实现
package.json
tsconfig.json
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

看到类似下面的运行结果，说明启动成功。修改代码后，会自动重启服务。

```text
Found 0 errors. Watching for file changes.
[server] Booting...
[server] Startup successful in: 5.399953 ms
[server] Listening on: http://localhost:3000/gw/doc
```

此时使用浏览器打开 `http://localhost:3000/gw/doc` 可以直接打开并查看接口文档