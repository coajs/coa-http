import { CoaError } from 'coa-error'
import { IncomingMessage } from 'http'

const DefaultMaxBodySize = 10 * 1024 * 1024

export class CoaRequestBody {

  private req: IncomingMessage
  private readonly maxBodySize: number

  constructor (req: IncomingMessage, maxBodySize = DefaultMaxBodySize) {
    this.req = req
    this.maxBodySize = maxBodySize
  }

  async get () {

    const params = { rawBody: '' as string, body: {} as { [key: string]: any } }

    const contentLength = parseInt(this.req.headers['content-length'] || '') || 0

    if (contentLength < 1)
      return params

    // 预判断大小
    if (contentLength > this.maxBodySize * 2) {
      const error = new CoaError('Gateway.BodyDataTooLarge', '网关数据过大，强行终止')
      this.req.destroy(error)
      throw error
    }
    if (contentLength > this.maxBodySize) {
      throw new CoaError('Gateway.BodyDataTooLarge', '网关数据过大')
    }

    // 获取原始body
    params.rawBody = await this.getRawBody(contentLength)

    // 判断类型
    const contentType = this.req.headers['content-type'] || ''

    // 处理json
    if (contentType.includes('application/json')) {
      try {
        params.body = JSON.parse(params.rawBody)
      } catch (e) {
        throw new CoaError('Gateway.BodyDataParseError', '网关数据解析JSON失败')
      }
    }

    return params
  }

  protected getRawBody (contentLength: number) {

    return new Promise<string>((resolve, reject) => {

      let raw = [] as any[], received = 0, destroy = false

      const onAborted = () => {
        // console.log('onAborted')
        reject(new CoaError('Gateway.BodyDataAborted', '网关数据传输异常终止'))
      }

      const onError = (err: Error) => {
        // console.log('onError')
        reject(new CoaError('Gateway.BodyDataError', '网关数据传输错误:' + err.toString()))
      }

      const onData = (data: any) => {

        // console.log('onData', data.length, complete, destroy)

        received += data.length

        if (destroy) return
        if (received > contentLength) {
          destroy = true
          onClose()
          this.req.unpipe()
          this.req.destroy(new CoaError('Gateway.BodyDataContentError', '网关数据大小不符，强行终止'))
          return
        }

        raw.push(data)
      }

      const onEnd = () => {
        // console.log('onEnd', raw.length)
        if (received !== contentLength) {
          reject(new CoaError('Gateway.BodyDataContentError', '网关数据大小不符'))
          return
        }
        resolve(raw.toString())
      }

      const onClose = () => {
        // console.log('onClose')
        raw = null as any
        this.req.removeListener('aborted', onAborted)
        this.req.removeListener('error', onError)
        this.req.removeListener('data', onData)
        this.req.removeListener('end', onEnd)
        this.req.removeListener('close', onClose)
      }

      this.req.addListener('aborted', onAborted)
      this.req.addListener('close', onClose)
      this.req.addListener('data', onData)
      this.req.addListener('end', onEnd)
      this.req.addListener('error', onError)

    })
  }

}