import { http } from '..'

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
  }
})
