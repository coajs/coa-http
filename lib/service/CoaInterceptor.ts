import { CoaContext } from './CoaContext'
import { CoaRouterHandlerResult } from './CoaRouter'

export class CoaInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async request(ctx: CoaContext): Promise<void> {
    // do something
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async response(ctx: CoaContext, result: CoaRouterHandlerResult) {}
}
