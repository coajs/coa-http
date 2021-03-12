export class CoaStorage {

  private data = { local: {} as any, session: {} as any } as any

  local (name: string, data: any, ms = 0) {
    this.data.local[name] = { action: 'set', data, ms }
    if (data === null || data === undefined) this.data.local[name].action = 'remove'
    return this
  }

  session (name: string, data: any, ms = 0) {
    this.data.session[name] = { action: 'set', data, ms }
    if (data === null || data === undefined) this.data.session[name].action = 'remove'
    return this
  }

  toJSON () {
    return this.data
  }
}