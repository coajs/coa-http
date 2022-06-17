import { CoaContext } from './CoaContext'
import { CoaRouterHandlerResult } from './CoaRouter'

export class CoaInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async request(ctx: CoaContext): Promise<void> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async response(ctx: CoaContext, result: CoaRouterHandlerResult): Promise<CoaRouterHandlerResult | void> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async responseError(handlerError: { error: { code: string; message: string } }, rawError: any): Promise<CoaRouterHandlerResult | void> {}
}
