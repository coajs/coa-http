import { CoaEnv } from 'coa-env'
import { CoaContext, CoaHttp } from '../../lib'

export const http = new CoaHttp(CoaContext, new CoaEnv('1.0.0'), { baseUrl: '/api/' })

http.start().then(
  () => {},
  () => {}
)
