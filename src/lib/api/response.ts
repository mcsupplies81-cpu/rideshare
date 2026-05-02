export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data, ok: true }, { status })
}

export function err(message: string, status = 400): Response {
  return Response.json({ error: message, ok: false }, { status })
}
