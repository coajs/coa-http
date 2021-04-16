import { _ } from 'coa-helper'
import { CoaRouter } from '../service/CoaRouter'

export namespace CoaSwagger {
  export interface Config {
    swaggerFilter: boolean,
    swaggerDocExpansion: 'full' | 'list' | 'none'
  }
}

export class CoaSwagger {

  private data = {
    openapi: '3.0.0',
    info: {
      title: '后端接口文档',
      version: '',
      // description: '',
    },
    externalDocs: {
      description: '→ 点击此处，自动生成接口代码',
      url: ''
    },
    servers: [{
      description: 'Gateway',
      url: ''
    }],
    paths: {} as any,
    tags: {} as any,
    components: {
      securitySchemes: {
        userAccess: { type: 'apiKey', in: 'header', name: 'access' },
        managerAccess: { type: 'apiKey', in: 'header', name: 'passport' },
      }
    },
  }

  private readonly router: CoaRouter<any>
  private readonly config: CoaSwagger.Config

  constructor (router: CoaRouter<any>, config: CoaSwagger.Config) {
    this.router = router
    this.config = Object.assign({}, { swaggerFilter: false, swaggerDocExpansion: 'list' }, config)
  }

  getData (matchGroup: string, serverUrl: string, codeUrl: string, version: string) {
    matchGroup = _.startCase(matchGroup)

    // 当前配置
    const groupConfig = this.router.configs[matchGroup] || {}

    // 授权信息
    const security = Object.keys(groupConfig.components?.securitySchemes || this.data.components.securitySchemes)

    // 处理path
    _.forEach(this.router.layers, ({ group, tag, method, path, options }) => {
      if (!(group && tag && options.name)) return
      if (group !== matchGroup) return
      method = method.toLowerCase()
      if (!this.data.tags[tag]) this.data.tags[tag] = true
      if (!this.data.paths[path]) this.data.paths[path] = {}
      this.data.paths[path][method] = this.getOneAction(tag, method, path, options, security)
    })
    // 处理tag
    this.data.tags = Object.keys(this.data.tags).map(name => ({ name, description: this.router.tags[name] || '' }))
    // 处理server
    this.data.servers[0].url = serverUrl
    // 处理代码链接
    this.data.externalDocs.url = codeUrl + _.snakeCase(matchGroup)
    // 处理版本号
    this.data.info.version = version

    // 扩展配置
    _.assign(this.data, groupConfig)

    return this.data
  }

  getHtml (dataUrl: string, group: string = '') {
    const groups = {} as any
    _.forEach(this.router.layers, ({ group }) => {
      if (group && !groups[group]) groups[group] = true
    })
    if (group.length) group = _.startCase(group)
    const groupNames = group.length && groups[group] ? [group] : Object.keys(groups)
    const urls = groupNames.map(name => ({ name, url: dataUrl + _.snakeCase(name) }))
    return getHtml(urls, this.config)
  }

  private getOneAction (tag: string, method: string, path: string, opt: any, security: string[]) {

    opt = _.defaults(opt, {
      name: '',
      desc: '',
      path: {},
      query: {},
      body: {},
      param: {},
      result: {},
      delete: false,
      access: true,
    })

    // 预处理
    const doc = {
      summary: opt.name,
      description: opt.desc,
      tags: [tag],
      parameters: [] as object[],
      requestBody: {
        content: {
          'application/json': {}
        }
      },
      responses: {
        default: {
          description: 'OK',
          content: {
            'application/json': {}
          }
        },
      },
      deprecated: opt.delete,
      security: <any[]>[]
    }

    // 处理param参数
    if (!_.isEmpty(opt.param)) {
      if (method === 'get')
        opt.query = _.extend(opt.param, opt.query)
      else
        opt.body = _.extend(opt.param, opt.body)
    }
    if (!opt.path['id'] && path.endsWith(':id')) {
      opt.path['id'] = { required: true, description: 'ID', example: '' }
    }

    // 处理path
    _.forEach(opt.path, (v: any, k: string) => {
      doc.parameters.push({
        in: 'path',
        name: v.name || k,
        required: !!v.required,
        description: v.desc || v.description || '',
        example: v.example || '',
        schema: { type: v.type || typeof v.example, }
      })
    })

    // 处理query参数
    _.forEach(opt.query, (v: any, k: string) => {
      doc.parameters.push({
        in: 'query',
        name: v.name || k,
        required: !!v.required,
        description: v.desc || v.description || '',
        example: v.example || '',
        schema: { type: v.type || typeof v.example, }
      })
    })

    // 处理body参数
    if (method !== 'get' && !_.isEmpty(opt.body)) {
      doc.requestBody.content['application/json'] = { schema: this.getSchema(opt.body) }
    } else {
      delete (doc as any).requestBody
    }

    // 处理responses参数
    if (!_.isEmpty(opt.result)) {
      doc.responses.default.content['application/json'] = { schema: this.getSchema(opt.result) }
    }

    // 处理Access
    if (opt.access) {
      doc.security = security.map(item => ({ [item]: [] }))
    }

    return doc
  }

  private getSchema (data: any) {
    let schema = { type: 'object', properties: {} as any, required: [] as string[] }
    _.forEach(data, (v: any, k: string) => {
      schema.properties[k] = {
        description: v.desc || v.description,
        type: typeof v.example,
        example: v.example,
      }
      if (v.data) {
        const subSchema = this.getSchema(v.data)
        schema.properties[k] = _.extend(schema.properties[k], _.isArray(v.example) ? { type: 'array', items: subSchema } : subSchema)
        delete schema.properties[k].example
      }
      v.required && schema.required.push(k)
    })
    return schema
  }
}

const getHtml = (urls: object[], config: CoaSwagger.Config) => `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title>接口文档</title>
    <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3.46.0/favicon-32x32.png" sizes="32x32"/>
    <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3.46.0/favicon-16x16.png" sizes="16x16"/>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3.46.0/swagger-ui.css">
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
            font-size: 14px;
        }

        *,
        *:before,
        *:after {
            box-sizing: inherit;
        }

        body {
            margin: 0;
            background: #fafafa;
        }

        /* 下面是自定义 */

        /* 页面最大宽度 */
        .swagger-container .wrapper {
            max-width: 1080px;
        }
        
        /* 底部距离 */
        .swagger-container {
            margin-bottom: 100px;
        }

        /* 顶部描述文字隐藏，宽度限定 */
        .swagger-ui .topbar .download-url-wrapper .select-label > span {
            visibility: hidden;
            flex: 5;
        }
        
        /* 顶部选择框字体 */
        .swagger-ui .topbar .download-url-wrapper .select-label select {
            font-size: 13px;
            line-height: 15px;
        }
        
        /* 大标题下链接字体 */
        .swagger-ui .info .link .url {
            font-size: 12px;
            display: none;
        }
        
        /* 大标题下外部链接 */
        .swagger-ui .info .info__extdocs {
            font-size: 14px;
        }
        
        /* 头部上下间距 */
        .swagger-ui .info {
            margin: 35px 0;
        }
        
        /* https大框上下间距 */
        .swagger-ui .scheme-container {
            padding: 20px 0;
        }
        
        /* servers标题隐藏 */
        .swagger-ui .servers-title {
            display: none;
        }

        /* servers框对齐 */
        .swagger-ui .scheme-container .schemes {
            align-items: center;
        }
        
        /* 隐藏地址第一个字母 */
        .swagger-ui .opblock-summary .opblock-summary-path a:first-letter ,.swagger-ui .opblock-summary .opblock-summary-path__deprecated a:first-letter{
            font-size: 0;
        }
              
        /* 接口标题上下间距 */
        .swagger-ui .opblock-tag {
            padding: 0 20px 0 10px;
            margin-bottom: 0;
        }
        
        /* 接口标题上下间距 */
        .opblock-tag-section > div {
            margin-top: 15px !important;
        }
        
        /* 大标题字体 */
        .swagger-ui .info .title {
            font-size: 28px;
        }

        /* 大标题描述字体 */
        .swagger-ui .info .description p, .swagger-ui .info .link {
            font-size: 15px;
        }
        
        /* 接口标题字体 */
        .swagger-ui .opblock .opblock-summary-method, .swagger-ui .opblock .opblock-summary-path,.swagger-ui .opblock .opblock-summary-path__deprecated, .swagger-ui .opblock .opblock-summary-description {
            font-size: 14px;
        }

        /* 模块标题字体 */
        .swagger-ui .opblock-tag, .swagger-ui .opblock-tag small {
            font-size: 16px;
        }
        
        /* 参数字体 */
        .swagger-ui .parameters-col_description {
            font-size: 13px;
        }
        
        /* 隐藏response栏 */
        .swagger-ui .response-controls{
            display: none;
        }
        
        /* response栏不显示curl框 */
        .swagger-ui .responses-inner > div > div > div:first-child {
            display: none;
        }
        
        /* response栏默认显示 */
        .swagger-ui .response-col_description {
            font-size: 12px;
        }
        
        /* 修复response栏对齐 */
        .swagger-ui table tbody tr td{
            padding: inherit;
        }
        
        /* 修复response的links对齐 */
        .swagger-ui .response-col_links{
            padding-top: 10px;
        }

    </style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3.46.0/swagger-ui-bundle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3.46.0/swagger-ui-standalone-preset.js"></script>
<script>
    window.onload = function () {

        window.ui = SwaggerUIBundle({

            urls: ${JSON.stringify(urls)},

            dom_id: '#swagger-ui',

            deepLinking: true,
            
            filter: ${config.swaggerFilter},

            validatorUrl: null,

            docExpansion: '${config.swaggerDocExpansion}',

            defaultModelsExpandDepth: 10,
            defaultModelExpandDepth : 10,
            displayRequestDuration  : true,

            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset,
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl,
            ],
            layout : 'StandaloneLayout',
        });
    };
</script>
</body>
</html>
`