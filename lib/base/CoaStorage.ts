interface CoaStorageData {
  local: any
  session: any
}

export class CoaStorage {
  private readonly data: CoaStorageData = { local: {}, session: {} }

  local(name: string, data: any, ms = 0) {
    this.data.local[name] = { action: 'set', data, ms }
    if (data === null || data === undefined) this.data.local[name].action = 'remove'
    return this
  }

  session(name: string, data: any, ms = 0) {
    this.data.session[name] = { action: 'set', data, ms }
    if (data === null || data === undefined) this.data.session[name].action = 'remove'
    return this
  }

  toJSON() {
    return this.data
  }
}
