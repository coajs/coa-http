import { IncomingMessage, ServerResponse } from 'http'
import { CoaSession } from '../lib/CoaSession'

export namespace CoaContext {
  export type Constructor<T> = new (req: IncomingMessage, res: ServerResponse) => T
}

export class CoaContext {

  public readonly req: IncomingMessage
  public readonly res: ServerResponse

  public readonly runtime = {
    startAt: process.hrtime.bigint(),
    accessLog: true
  }

  public readonly response = {
    statusCode: 200 as number,
    contentType: 'application/json; charset=utf-8' as string,
    cacheControl: 'no-cache',
    body: '' as string
  }

  public readonly request = {
    rawBody: '' as string,
    query: {} as { [key: string]: string },
    body: {} as { [key: string]: any },
    path: [] as string[]
  }

  private cacheSessions: { [name: string]: CoaSession } = {}

  constructor (req: IncomingMessage, res: ServerResponse) {
    this.req = req
    this.res = res
  }

  get protocol () {
    const proto = this.req.headers['x-client-scheme'] || this.req.headers['x-scheme'] || this.req.headers['x-forwarded-proto'] || ''
    return proto.toString().split(',', 1)[0].trim() || 'http'
  }

  get host () {
    const host = this.req.headers['ali-swift-stat-host'] || this.req.headers['x-forwarded-host'] || this.req.headers['host'] || ''
    return host.toString().split(',', 1)[0].trim() || ''
  }

  session (name: string) {
    name = name.toLowerCase()
    if (!this.cacheSessions[name])
      this.cacheSessions[name] = new CoaSession(this.get(name) || '')
    return this.cacheSessions[name]
  }

  get<T = any> (name: string): T | undefined {
    return this.request.query[name] || this.request.body[name] || this.req.headers[name.toLowerCase()] || undefined
  }

  html (context: string) {
    this.response.contentType = 'text/html; charset=utf-8'
    this.response.body = context
  }

  json (data: object) {
    this.response.contentType = 'application/json; charset=utf-8'
    this.response.body = JSON.stringify(data)
  }

}