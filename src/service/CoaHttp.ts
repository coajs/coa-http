import { CoaEnv } from 'coa-env'
import { CoaSwagger } from '../lib/CoaSwagger'
import { CoaSwaggerCode } from '../lib/CoaSwaggerCode'
import { CoaApplication } from './CoaApplication'
import { CoaContext } from './CoaContext'
import { CoaRouter } from './CoaRouter'

export namespace CoaHttp {
  export interface Config extends CoaRouter.Config, CoaSwagger.Config {
    routeDir: string
  }
}

export class CoaHttp<T extends CoaContext> {

  public readonly router: CoaRouter<T>

  private readonly application: CoaApplication<T>
  private readonly config: CoaHttp.Config
  private readonly env: CoaEnv

  constructor (Context: CoaContext.Constructor<T>, env?: CoaEnv, config?: Partial<CoaHttp.Config>) {
    this.env = env || new CoaEnv('1.0.0')
    this.config = Object.assign({}, { routeDir: 'gateway' }, config) as CoaHttp.Config
    this.router = new CoaRouter<T>(this.config)
    this.application = new CoaApplication<T>(Context, this.router)
  }

  async start () {

    // 注册系统默认路由
    this.registerSystemRoute()

    // 扫描并注册路由
    await this.router.registerDir(this.config.routeDir)

    // 启动应用
    await this.application.start(this.config.baseUrl + 'doc')
  }

  // 注册路由
  register (name: string, routes: CoaRouter.Routes<T>) {
    this.router.register(name, routes)
  }

  // 注册配置
  routerConfig (config: any) {
    this.router.setSwaggerConfig(config)
  }

  // 注册系统内置路由
  private registerSystemRoute () {
    const baseUrl = this.config.baseUrl
    // 注册文档
    this.router.on('GET', baseUrl + 'doc', async ctx => {
      const swagger = new CoaSwagger(this.router, this.config)
      return swagger.getHtml(baseUrl + 'doc.json?group=', ctx.get('group'))
    })
    this.router.on('GET', baseUrl + 'doc.json', async ctx => {
      const swagger = new CoaSwagger(this.router, this.config)
      return swagger.getData(ctx.request.query.group, `${ctx.protocol}://${ctx.host}`, baseUrl + 'doc.code?group=', this.env.version)
    })
    this.router.on('GET', baseUrl + 'doc.code', async ctx => {
      const swaggerCode = new CoaSwaggerCode(this.router)
      return swaggerCode.getHtml(baseUrl, ctx.request.query.group)
    })
    // 注册常用路由
    this.router.on('GET', baseUrl + 'version', async () => this.env.version)
    this.router.on('GET', '/health', async () => '')
    this.router.on('GET', '/favicon.ico', async () => '')
  }
}