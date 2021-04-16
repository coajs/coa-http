import { CoaError } from 'coa-error'
import { _ } from 'coa-helper'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as querystring from 'querystring'

export namespace CoaRouter {
  export type Options = {
    name?: string,
    desc?: string,
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    param?: { [i: string]: any },
    result?: { [i: string]: any },
    delete?: boolean,
    legacy?: string,
    access?: string
  }
  export type Handler<T> = (ctx: T) => Promise<object | string>
  export type Routes<T> = { [path: string]: { options: Options, handler: Handler<T> } }
  export type Layer<T> = { group: string, tag: string, method: string, path: string, options: Options, handler: CoaRouter.Handler<T> }
  export type Layers<T> = { [pathname: string]: Layer<T> }
  export type Tags = { [tag: string]: string }
  export type SwaggerConfigs = { [group: string]: any }
  export interface Config {
    baseUrl: string
  }
}

export class CoaRouter<T> {

  public readonly layers: CoaRouter.Layers<T> = {}
  public readonly tags: CoaRouter.Tags = {}
  public readonly configs: CoaRouter.SwaggerConfigs = {}

  private readonly DATA = { group: '', tag: '' }
  private readonly config: CoaRouter.Config

  constructor (config: CoaRouter.Config) {
    this.config = Object.assign({}, { baseUrl: '/api/' }, config)
  }

  // 注册一批路由
  register (name: string, routes: CoaRouter.Routes<T>) {
    this.tags[this.DATA.tag] = name
    Object.keys(routes).forEach(path => {
      const { options, handler } = routes[path] || {}
      const { method, name } = options
      if (!(path && method && name && handler)) return
      if (!path.startsWith('/')) path = this.config.baseUrl + path
      this.on(method, path, handler, options)
    })
  }

  // 设置当前组的路由配置
  setSwaggerConfig (config: any) {
    const { group } = this.DATA
    this.configs[group] = config
  }

  // 扫描并注入路由文件
  async registerDir (dir: string) {
    dir = path.resolve(process.env.NODE_PATH || '', dir)
    const groups = await fs.readdir(dir, { withFileTypes: true })
    for (const group of groups) {
      if (!group.isDirectory()) continue
      const files = await fs.readdir(path.resolve(dir, group.name))
      for (const file of files) {
        if (!file.endsWith('.js')) continue
        this.group(group.name, file.replace('.js', ''))
        require(path.resolve(dir, group.name, file))
        this.group('', '')
      }
    }
  }

  // 新增一个路由
  on (method: string, path: string, handler: CoaRouter.Handler<T>, options: CoaRouter.Options = {}) {
    const { group, tag } = this.DATA
    this.layers[path.toLowerCase()] = { group, tag, method, path, options, handler }
  }

  // 路由寻址
  lookup (method: string = '', url: string = '') {

    const params = { query: {} as { [key: string]: string }, path: [] as string[] }

    const urls = url.split('?')
    const path = urls[0].toLowerCase() || ''

    // 添加URL路径参数的支持
    let layer = this.layers[path]
    if (!layer) {
      // 目前仅支持以*结尾的通配符
      const path2 = path.replace(/([/.])(\w+)$/, (str, $1, $2) => {
        params.path.push($2)
        return $1 + '*'
      })
      layer = this.layers[path2]
    }

    layer || CoaError.throw('Gateway.NotFound', '网关接口不存在')
    layer.method === method || CoaError.throw('Gateway.MethodNotAllowed', '当前网关接口请求方式不被允许')
    const handler = layer.handler || CoaError.throw('Gateway.HandlerNotFound', '当前网关接口处理方法不存在')
    const group = layer.group

    // 解析参数
    if (urls[1])
      params.query = querystring.parse(urls[1]) as { [key: string]: string }

    return { handler, params, group }
  }

  private group (group: string, tag: string) {
    this.DATA.group = _.startCase(group)
    this.DATA.tag = _.startCase(tag.replace(/^a/, ''))
  }

}