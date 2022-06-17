import { CoaEnv } from 'coa-env'
import { CoaHttp } from '../../lib'
import { MyContext } from './MyContext'
import { MyInterceptor } from './MyInterceptor'

// 构造 HTTP 实例
export const http = new CoaHttp(MyContext, { baseUrl: '/api/' })

// 使用环境变量，可选
http.useEnv(new CoaEnv('1.0.0'))

// 使用拦截器，可选
http.useInterceptor(new MyInterceptor())

// 启动 HTTP 服务
http.start()
