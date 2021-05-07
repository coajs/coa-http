import { IncomingMessage, ServerResponse } from 'http'
import { CoaSession } from '../lib/CoaSession'

export type CoaContextConstructor<T> = new (req: IncomingMessage, res: ServerResponse) => T

interface ConaContextRequest{
  rawBody: string
  query: { [key: string]: string }
  body: { [key: string]: any }
  path: string[]
}

export class CoaContext {
  // 原生请求
  public readonly req: IncomingMessage
  // 原生响应
  public readonly res: ServerResponse

  // 一些运行时的配置
  public readonly runtime = {
    startAt: process.hrtime.bigint(),
    accessLog: true
  }

  // 响应结果等信息
  public readonly response = {
    respond: true,
    statusCode: 200 as number,
    contentType: '' as string,
    cacheControl: 'no-cache',
    body: '' as string
  }

  // 请求的参数等信息
  public readonly request: ConaContextRequest = { rawBody: '', query: {}, body: {}, path: [] }

  // 缓存的session信息
  private cacheSessions: { [name: string]: CoaSession } = {}

  constructor (req: IncomingMessage, res: ServerResponse) {
    this.req = req
    this.res = res
  }

  // 获取客户端协议，支持cdn
  get protocol () {
    const proto = this.req.headers['x-client-scheme'] || this.req.headers['x-scheme'] || this.req.headers['x-forwarded-proto'] || ''
    return proto.toString().split(',', 1)[0].trim() || 'http'
  }

  // 获取host信息，支持主流cdn
  get host () {
    const host = this.req.headers['ali-swift-stat-host'] || this.req.headers['x-forwarded-host'] || this.req.headers.host || ''
    return host.toString().split(',', 1)[0].trim() || ''
  }

  // 根据session名称，获取session信息，支持各种类型的参数，包括 query body headers
  session (name: string) {
    name = name.toLowerCase()
    if (!this.cacheSessions[name]) { this.cacheSessions[name] = new CoaSession(this.get(name) || '') }
    return this.cacheSessions[name]
  }

  // 获取参数信息，优先级为 query -> body -> header
  get<T = any> (name: string): T | undefined {
    return this.request.query[name] || this.request.body[name] || this.req.headers[name.toLowerCase()] || undefined
  }

  // 设置为html结果
  html (context: string) {
    this.response.contentType = 'text/html; charset=utf-8'
    this.response.body = context
  }

  // 设置为json格式结果
  json (data: any) {
    this.response.contentType = 'application/json; charset=utf-8'
    this.response.body = JSON.stringify(data)
  }

  // 设置为自定义响应结果
  custom () {
    this.response.respond = false
    return undefined
  }
}
