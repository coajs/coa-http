# coa-http

[![GitHub license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![npm version](https://img.shields.io/npm/v/coa-http.svg?style=flat-square)](https://www.npmjs.org/package/coa-http)
[![npm downloads](https://img.shields.io/npm/dm/coa-http.svg?style=flat-square)](http://npm-stat.com/charts.html?package=coa-http)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/coajs/coa-http/pulls)

English | [简体中文](README.zh-CN.md)

A simple, fast, lightweight HTTP service frame, is born for the API.

## Feature

- **For the API** Designed for API development, there is no need to consider complex page data rendering logic
- **Lightweight** Less than 10K, do not rely on third-party libraries, not encapsulation
- **Flexible** Support micro-service, Serverless mode, Context free expansion
- **Document friendship** Automatically generate API documents, automatically generate front-end code
- **TypeScript** All written in TypeScript, type constraint, IDE friendship
- **Deno** Can be supported in Deno (TODO)

## Reference

- Inspired by [koa](https://www.npmjs.com/package/koa), improve the context generation mechanism
- Inspired by [koa-router](https://www.npmjs.com/package/koa-router), improve the routing generation mechanism
- Inspired by [koa-bodyparser](https://www.npmjs.com/package/koa-bodyparser), improve the request body processing mechanism
- Inspired by [egg](https://eggjs.org/zh-cn), improve the context expansion mechanism
- Based on [swagger-ui](https://swagger.io/tools/swagger-ui), complete the automatic generation of interface documents

## Iteration

- The first version [coajs](https://www.npmjs.com/package/coajs): The first version released in 2019, it belongs to the integration of third-party libraries. From multiple online projects, it is easy to deploy updates as a separate library. With the continuous iteration, there is more and more things, `coajs` becomes more bloated, is not suitable for lightweight small projects. Iterate 114 times after stop maintenance

- Second version [coa-serve](https://www.npmjs.com/package/coa-serve): For the bloated problem of the first release, the various components are split based on `coajs`, separate the base components and core components into separate libraries, and **open source**. At the same time, there is a lot of optimization for document generation mechanisms, routing retrieval, system environment configuration. Currently stable, all of my online `coajs` projects have been migrated to `coa-server`

- Third version [coa-http](https://www.npmjs.com/package/coa-http): The current version. With the continuous iteration, the way the interface provides service is not limited to `http`, put the `TCP`, `Websocket`, etc., directly integrate to `coa-serve` is not elegant。In addition, ~~ As the author's cognitive progress ~~, `koa` ecosystem is not the best choice. Therefore, it is planned to disassemble the `coa-serve` to reconfigure to [coa-http](https://www.npmjs.com/package/coa-http), [coa-tcp](https: // www. npmjs.com/package/coa-tcp), [coa-websocket](Https://www.npmjs.com/fectage/coa-websocket), etc. This project `coa-http` is one of these three, still in the beta stage

## Quick Start

### Environmental install

Make sure that the latest stable version of [Node.js](https://nodejs.org) is installed on the operating system

### Create a project

```shell
mkdir <project-name>
cd <project-name>

yarn add coa-http
yarn add typescript tsc-watch @types/node -D
```

### Create files

```shell
gateway            # Gateway layer
├─ index.ts        # Gateway entrance
├─ debug           # debug module
│  └─ test.ts      # The route of the debug module
service            # Service layer
├─ index.ts        # Implement service
package.json
tsconfig.json
```

Write the code in `gateway/index.ts`

```typescript
import { CoaContext, CoaHttp } from 'coa-http'

export const http = new CoaHttp(CoaContext)

http.start().then(() => {
  // Do something after starting
})
```

Write the code in `gateway/debug/test.ts`

```typescript
import { http } from '..'

http.router.register('Debug Something', {
  '/debug/test/hello': {
    options: {
      method: 'GET',
      name: 'Hello, world',
    },
    async handler() {
      return { result: 'hello,world!' }
    },
  },
})
```

Write configuration in `tsconfig.json`

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
  "include": ["gateway", "service"]
}
```

Add `dev` script of `script` node in `package.json`

```json
{
  "scripts": {
    "dev": "HOST=3000 NODE_PATH=node_run tsc-watch --onSuccess 'node node_run/gateway'"
  }
}
```

### Start up

```shell
yarn dev
```

See something similar to the following operating results, indicating the success of the program starts. After modifying the code, it will automatically restart the service.

```text
Found 0 errors. Watching for file changes.
[server] Booting...
[server] Startup successful in: 5.399953 ms
[server] Listening on: http://localhost:3000/gw/doc
```

At this point, open the `http://localhost:3000/gw/doc`, you can directly view the interface document.

## Route

### Basic usage

Use the `http.router.register` method to register the route, a simplest route as shown below.

```typescript
http.router.register('Debug Something', {
  '/debug/test/hello': {
    options: {
      name: 'Test Something', // name
      method: 'GET', // method
      param: {
        title: { required: true, description: 'Title parameters', example: 'test' },
      },
    },
    async handler(ctx) {
      // Get all query parameters
      const query = ctx.request.query
      // Get title parameters
      const title2 = ctx.get('title')
      // Return the result with JSON format
      return { query, title }
    },
  },
})
```

### Route group

Each of the registered routes will be automatically divided into a group. When developing, you can split each module into a file separate grouping.

```typescript
// gateway/module-a.ts
http.router.register('Module A', {
  '/api/module-a/action-1': {
    /* ... */
  },
  '/api/module-a/action-2': {
    /* ... */
  },
})
// gateway/module-b.ts
http.router.register('Module B', {
  '/api/module-b/action-1': {
    /* ... */
  },
  '/api/module-b/action-2': {
    /* ... */
  },
  '/api/module-b/action-3': {
    /* ... */
  },
})
```

### Context

Similar to `koa`, `handler` method contains a `ctx` parameter. `ctx` is an instance of `Context` that contains all the above information during the current request.

```typescript
http.router.register('Debug Something', {
  '/debug/test/hello': {
    options: {
      method: 'GET',
      name: 'Hello, world',
    },
    async handler(ctx) {
      // ctx contains all context information
      return { result: 'hello, world!' }
    },
  },
})
```

### Custom response format

`coa-http` Natively supports the response results in `json` and `text` format. But sometimes we need to customize the response format, such as a stream format. The following example shows the returns of resources on the network through the stream.

```typescript
http.router.register('Debug Something', {
  '/debug/test/proxy': {
    options: {
      method: 'GET',
      name: 'Returns the result with stream',
      param: {
        url: { required: true, description: 'Network resource path', example: 'http://github.com' },
      },
    },
    async handler(ctx) {
      // Get url parameters
      const url = ctx.required('url', '')

      // Get resource streams on the network
      const { data, status, headers } = await axios.get(url, { responseType: 'stream' }).catch((e) => e.response)

      // Set response info
      ctx.res.statusCode = status
      ctx.res.setHeader('Content-Type', headers['content-type'])

      // Resource flow on the network flows in the pipeline
      data.pipe(ctx.res)

      // Custom response results, coa-http will not perform subsequent response processing
      return ctx.custom()
    },
  },
})
```
