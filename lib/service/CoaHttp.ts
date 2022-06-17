import { CoaEnv } from 'coa-env'
import { CoaSwagger, CoaSwaggerConfig } from '../base/CoaSwagger'
import { CoaSwaggerCode } from '../base/CoaSwaggerCode'
import { CoaApplication } from './CoaApplication'
import { CoaContext, CoaContextConstructor } from './CoaContext'
import { CoaInterceptor } from './CoaInterceptor'
import { CoaRouter, CoaRouterConfig, CoaRouterRoutes } from './CoaRouter'

interface CoaHttpConfig extends CoaRouterConfig, CoaSwaggerConfig {
  routeDir: string
}

export class CoaHttp<T extends CoaContext> {
  public readonly router: CoaRouter<T>

  private readonly application: CoaApplication<T>
  private readonly config: CoaHttpConfig
  private env?: CoaEnv

  constructor(Context: CoaContextConstructor<T>, config?: Partial<CoaHttpConfig>) {
    this.config = Object.assign({ routeDir: 'gateway' }, config) as CoaHttpConfig
    this.router = new CoaRouter<T>(this.config)
    this.application = new CoaApplication<T>(Context, this.router)
  }

  // 使用拦截器
  useInterceptor(interceptor: CoaInterceptor) {
    this.application.interceptor = interceptor
  }

  // 使用环境
  useEnv(env: CoaEnv) {
    this.env = env
  }

  // 开始启动
  async start() {
    // 注册系统默认路由
    this.registerSystemRoute()

    // 扫描并注册路由
    await this.router.registerDir(this.config.routeDir)

    // 启动应用
    await this.application.start(this.config.baseUrl + 'doc')

    return { server: this.application.server }
  }

  // 注册路由
  register(name: string, routes: CoaRouterRoutes<T>) {
    this.router.register(name, routes)
  }

  // 注册配置
  routerConfig(config: any) {
    this.router.setSwaggerConfig(config)
  }

  // 注册系统内置路由
  private registerSystemRoute() {
    const baseUrl = this.config.baseUrl
    // 注册文档
    this.router.on('GET', baseUrl + 'doc', async (ctx) => {
      const swagger = new CoaSwagger(this.router, this.config)
      return swagger.getHtml(baseUrl + 'doc.json?group=', ctx.get('group'))
    })
    this.router.on('GET', baseUrl + 'doc.json', async (ctx) => {
      const swagger = new CoaSwagger(this.router, this.config)
      return swagger.getData(ctx.request.query.group, `${ctx.protocol}://${ctx.host}`, baseUrl + 'doc.code?group=', this.env?.version || '1.0.0')
    })
    this.router.on('GET', baseUrl + 'doc.code', async (ctx) => {
      const swaggerCode = new CoaSwaggerCode(this.router)
      return swaggerCode.getHtml(baseUrl, ctx.request.query.group)
    })
    // 注册常用路由
    this.router.on('GET', baseUrl + 'version', async () => this.env?.version || '1.0.0')
    this.router.on('ALL', '/', async () => '')
    this.router.on('GET', '/health', async () => '')
    this.router.on('GET', '/favicon.ico', async () => '')
  }
}
