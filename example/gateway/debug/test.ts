import { mkdirSync, writeFileSync } from 'fs'
import { http } from '..'
import _ = require('lodash')

http.router.register('调试', {

  '/debug/test/hello': {
    options: {
      method: 'GET',
      name: '你好世界'
    },
    async handler () {
      return { result: 'hello,world!' }
    }
  },

  '/debug/test/form-data': {
    options: {
      method: 'POST',
      name: '测试from-data'
    },
    async handler (ctx) {
      const request = ctx.request
      return { request }
    }
  },

  '/debug/test/upload': {
    options: {
      method: 'POST',
      name: '测试文件上传'
    },
    async handler (ctx) {
      const files = [] as string[]
      const dir = 'dist/temp/upload/'

      mkdirSync(dir, { recursive: true })

      _.forEach(ctx.request.file, (item) => {
        const file = 'file' + Date.now().toString() + _.toString(item.filename)
        writeFileSync(dir + file, item.data)
        files.push(file)
      })

      return { files, rawBody: ctx.request.rawBody.toString(), file: ctx.request.file }
    }
  }
})
