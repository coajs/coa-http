import { _ } from 'coa-helper'
import { CoaRouter } from '../service/CoaRouter'

export class CoaSwaggerCode {
  private readonly router: CoaRouter<any>

  constructor (router: CoaRouter<any>) {
    this.router = router
  }

  getHtml (base: string, matchGroup: string) {
    matchGroup = _.startCase(matchGroup)

    const layerTagMaps: { [tag: string]: string[] } = {}
    const code = new Code()

    // 预处理
    _.forEach(this.router.layers, ({ group, tag, method, path, options: { name } }, key) => {
      if (!name) return
      if (group !== matchGroup) return
      if (!layerTagMaps[tag]) layerTagMaps[tag] = []
      layerTagMaps[tag].push(key)
    })

    // 开始处理代码

    code.newGroup(base + matchGroup)

    _.forEach(layerTagMaps, (paths, tag) => {
      code.newTag(tag, this.router.tags[tag])

      _.forEach(paths, key => {
        const { method, path, options: { name = '' } } = this.router.layers[key]
        const action = path.replace(base, '').split(/[/.]/, 3).pop() || ''
        code.newApi(name, method, action, path)
      })

      code.close()
    })

    code.close()

    return toHtml(matchGroup, code.toString())
  }
}

class Code {
  private readonly contents = [] as string[]
  private indent = ''

  newGroup (group: string) {
    this.newline(`export const ${_.camelCase(group)} = new class {`)
    this.newIndent()
  }

  newTag (tag: string, name: string) {
    this.newline()
    this.newline(`// ${_.startCase(tag)} ${name}`)
    this.newline(`${_.camelCase(tag)} = new class {`)
    this.newIndent()
  }

  newApi (name: string, method: string, action: string, path: string) {
    this.newline(`// ${name}`)
    this.newline(`${_.camelCase(action)} = (param?: Gateway.Param, option?: Gateway.Option) => gate.request('${method.toLowerCase()}', '${path.substr(1)}', param, option)`)
  }

  close () {
    this.newIndent('close')
    this.newline('}')
  }

  toString () {
    return this.contents.join('\n')
  }

  private newline (content: string = '') {
    this.contents.push(content.length ? this.indent + content : '')
  }

  private newIndent (mode: 'open' | 'close' = 'open') {
    if (mode === 'open') this.indent += '  '
    else this.indent = this.indent.substr(0, this.indent.length - 2)
  }
}

const toHtml = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title>接口代码 - ${_.startCase(title)}</title>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/highlightjs@9.16.2/styles/tomorrow.css">
    <script src="https://cdn.jsdelivr.net/npm/highlightjs@9.16.2/highlight.pack.min.js"></script>
    <script>hljs.initHighlightingOnLoad()</script>
    <style>
        * {
            margin: 0;
            padding: 0;
            font-family: SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;
            font-size: 14px;
        }
    </style>
</head>
<body>
<pre>
<code class="typescript">
${content}
</code>
</pre>
</body>
</html>
`
