import { CoaError } from 'coa-error'
import { _ } from 'coa-helper'
import { IncomingMessage } from 'http'
import * as querystring from 'querystring'

const DefaultMaxBodySize = 10 * 1024 * 1024

interface RequestBodyParams {
  rawBody: string
  body: { [key: string]: any}
  files: RequestBodyFile[]
}
interface RequestBodyFile {
  data: any
  key: string
  filename: string
  type: string
}

export class CoaRequestBody {
  private readonly req: IncomingMessage
  private readonly maxBodySize: number

  constructor (req: IncomingMessage, maxBodySize = DefaultMaxBodySize) {
    this.req = req
    this.maxBodySize = maxBodySize
  }

  async get () {
    const params: RequestBodyParams = { rawBody: '', body: {}, files: [] }

    const contentLength = parseInt(this.req.headers['content-length'] || '') || 0

    if (contentLength < 1) { return params }

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

    // 处理 json
    if (contentType.includes('application/json')) {
      try {
        params.body = JSON.parse(params.rawBody)
      } catch (e) {
        throw new CoaError('Gateway.BodyDataParseError', '网关数据解析JSON失败')
      }
    }

    // 处理 x-www-form-urlencoded
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        params.body = querystring.parse(params.rawBody)
      } catch (e) {
        throw new CoaError('Gateway.BodyDataParseError', '网关数据解析form-urlencoded参数失败')
      }
    }

    // 处理 multipart/form-data
    else if (contentType.includes('multipart/form-data')) {
      try {
        // 获取分隔符
        const boundary = contentType.split('boundary=')[1]
        if (!boundary) {
          throw new CoaError('Gateway.BodyDataParseError', '网关数据解析form-data参数boundary失败')
        }
        // 分割每个参数
        const rawDataArray = params.rawBody.split(boundary)
        for (const item of rawDataArray) {
          // 匹配结果
          const name = this.matching(item, /(?:name=")(.+?)(?:")/, true)
          const value = this.matching(item, /(?:\r\n\r\n)([\S\s]*)(?:\r\n--$)/)
          if (!name || !value) continue
          // 尝试获取文件名
          const filename = this.matching(item, /(?:filename=")(.*?)(?:")/, true)
          if (filename) {
            const type = this.matching(item, /(?:Content-Type:)(.*?)(?:\r\n)/, true)
            params.files.push({ data: value, key: name, filename, type })
          } else {
            params.body[name] = value
          }
        }
      } catch (e) {
        throw new CoaError('Gateway.BodyDataParseError', '网关数据解析form-data参数失败')
      }
    }

    return params
  }

  protected async getRawBody (contentLength: number) {
    return await new Promise<string>((resolve, reject) => {
      let raw = [] as Buffer[]
      let received = 0
      let destroy = false

      const onAborted = () => {
        // console.log('onAborted')
        reject(new CoaError('Gateway.BodyDataAborted', '网关数据传输异常终止'))
      }

      const onError = (err: any) => {
        // console.log('onError')
        reject(new CoaError('Gateway.BodyDataError', '网关数据传输错误:' + _.toString(err)))
      }

      const onData = (data: Buffer) => {
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

  private matching (string: string, regex: RegExp, trim = false) {
    const matches = string.match(regex)
    if (!matches || matches.length < 2) { return '' }
    const value = matches[1]
    return trim ? value.trim() : value
  }
}
