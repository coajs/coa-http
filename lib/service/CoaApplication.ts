import { echo } from 'coa-echo'
import { _ } from 'coa-helper'
import { createServer, IncomingMessage, Server, ServerResponse } from 'http'
import { CoaRequestBody } from '../base/CoaRequestBody'
import { CoaContext, CoaContextConstructor } from './CoaContext'
import { CoaRouter } from './CoaRouter'

export class CoaApplication<T extends CoaContext> {
  public readonly server: Server
  public readonly router: CoaRouter<T>
  private readonly Context: CoaContextConstructor<T>
  private readonly startAt: bigint = process.hrtime.bigint()

  constructor(Context: CoaContextConstructor<T>, router: CoaRouter<T>) {
    echo.info('[server] Booting...')
    this.Context = Context
    this.router = router
    this.server = createServer((req, res) => {
      this.requestListener(req, res).catch((e) => echo.error(e))
    })
  }

  async start(entry = '') {
    // 设置端口
    const port = parseInt(process.env.HOST || '') || 8000

    // 启动服务
    this.server.listen(port, () => {
      echo.info(`[server] Startup successful in: ${Number(process.hrtime.bigint() - this.startAt) / 1e6} ms`)
      echo.info(`[server] Listening on: http://localhost:${port}${entry}`)
    })
  }

  // 监听请求
  private async requestListener(req: IncomingMessage, res: ServerResponse) {
    const ctx = new this.Context(req, res)

    try {
      // 寻找路由
      const { handler, params: routeParams, group } = this.router.lookup(ctx.req.method, ctx.req.url)
      // 处理参数
      const bodyParams = await new CoaRequestBody(req).get()

      // 将route参数和body参数附加到ctx上
      Object.assign(ctx.request, routeParams, bodyParams)

      // 如果是系统默认路由，则不显示请求记录
      if (!group) ctx.runtime.accessLog = false

      // 执行方法
      const body = await handler(ctx)
      const type = typeof body

      if (type === 'object') {
        ctx.json(body)
      } else if (type === 'string') {
        ctx.html(body as string)
      }
    } catch (e: any) {
      // 捕获错误
      const isCoaError = e.name === 'CoaError'
      const isCoaContextError = e.name === 'CoaContextError'

      // 判断是否打印错误
      if (!(isCoaError || isCoaContextError) || e.stdout !== false) echo.error(e.stack || e.toString() || e)

      const error = {
        code: (isCoaError && e.code) || (isCoaContextError && 'Context.Error.' + _.toString(e.code)) || 'Gateway.HandlerError',
        message: e.message || e.toString(),
      }
      ctx.json({ error })

      echo.warn('# 请求: %s %s %j', ctx.req.method, ctx.req.url, ctx.request.body)
      echo.warn('# 返回: %j', { error })
    }

    // 如果不处理，则直接返回结果
    if (!ctx.response.respond) {
      return
    }

    // 开始处理结果
    ctx.res.statusCode = ctx.response.statusCode
    ctx.res.setHeader('Content-Type', ctx.response.contentType)
    ctx.res.setHeader('Cache-Control', ctx.response.cacheControl)

    // 发送结果
    ctx.res.end(ctx.response.body, () => {
      // 记录请求
      ctx.runtime.accessLog && echo.cyan(`[${ctx.req.method || ''}] ${ctx.req.url || ''} - ${Number(process.hrtime.bigint() - ctx.runtime.startAt) / 1e6}ms`)
    })
  }
}
