import { secure } from 'coa-secure'

export class CoaSession {
  private readonly value: any

  constructor(ticket: string) {
    this.value = secure.session_decode(ticket) || {}
  }

  get() {
    return this.value
  }

  encode(value: any, ms: number) {
    return secure.session_encode(value, ms)
  }
}
