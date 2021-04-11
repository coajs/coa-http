import { echo } from 'coa-echo'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { CoaRequestBody } from '../lib/CoaRequestBody'
import { CoaContext } from './CoaContext'
import { CoaRouter } from './CoaRouter'

export class CoaApplication<T extends CoaContext> {

  public readonly router: CoaRouter<T>

  private readonly Context: CoaContext.Constructor<T>
  private readonly startAt: bigint = process.hrtime.bigint()

  constructor (Context: CoaContext.Constructor<T>) {
    this.Context = Context
    this.router = new CoaRouter<T>()
    echo.info(`[server] Booting...`)
  }

  async start (entry: string = '') {

    // 设置端口
    const port = parseInt(process.env.HOST || '') || 8000

    // 启动服务
    const server = createServer((req, res) => this.requestListener(req, res).catch(e => echo.error(e)))
    server.listen(port, () => {
      echo.info(`[server] Startup successful in: ${Number(process.hrtime.bigint() - this.startAt) / 1e6} ms`)
      echo.info(`[server] Listening on: http://localhost:${port}${entry}`)
    })
  }

  // 监听请求
  private async requestListener (req: IncomingMessage, res: ServerResponse) {

    const ctx = new this.Context(req, res)

    try {

      // 寻找路由
      const { handler, params: routeParams, group } = this.router.lookup(ctx.req.method, ctx.req.url)
      // 处理参数
      const bodyParams = await new CoaRequestBody(req).get()

      Object.assign(ctx.request, routeParams, bodyParams)

      // 如果是系统默认路由，则不显示请求记录
      if (!group) ctx.runtime.accessLog = false

      // 执行方法
      const body = await handler(ctx) as any
      const type = typeof body as string

      if (type === 'object')
        ctx.json(body)
      else if (type === 'string')
        ctx.html(body)

    } catch (e) {

      const isCoaError = e.name === 'CoaError'
      const isCoaContextError = e.name === 'CoaContextError'

      // 判断是否打印错误
      if (!(isCoaError || isCoaContextError) || e.stdout !== false) echo.error(e.stack || e.toString() || e)

      const error = {
        code: (isCoaError && e.code) || (isCoaContextError && 'Context.Error.' + e.code) || 'Gateway.HandlerError',
        message: e.message || e.toString()
      }
      ctx.json({ error })

      echo.warn('# 请求: %s %s %j', ctx.req.method, ctx.req.url, ctx.request.body)
      echo.warn('# 返回: %j', { error })
    }

    // 开始处理结果
    ctx.res.statusCode = ctx.response.statusCode
    ctx.res.setHeader('Content-Type', ctx.response.contentType)
    ctx.res.setHeader('Cache-Control', ctx.response.cacheControl)

    ctx.res.end(ctx.response.body, () => {
      ctx.runtime.accessLog && echo.cyan(`[${ctx.req.method}] ${ctx.req.url} - ${Number(process.hrtime.bigint() - ctx.runtime.startAt) / 1e6}ms`)
    })
  }
}