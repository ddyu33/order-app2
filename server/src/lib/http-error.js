export class HttpError extends Error {
  constructor(status, code, message, options) {
    super(message, options)
    this.status = status
    this.code = code
  }
}

export function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
}
