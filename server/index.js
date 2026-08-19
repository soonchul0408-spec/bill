import { createServer } from 'node:http'
import { resolveApiRequest } from './apiHandlers.js'

const port = Number(process.env.API_SERVER_PORT || 8787)
const allowedOrigin = process.env.CORS_ORIGIN || ''

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(payload))
}

function setCorsHeaders(request, response) {
  if (!allowedOrigin) return

  const requestOrigin = request.headers.origin
  if (requestOrigin === allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    response.setHeader('Vary', 'Origin')
  }
}

const server = createServer(async (request, response) => {
  setCorsHeaders(request, response)

  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
    response.statusCode = 204
    response.end()
    return
  }

  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED', message: 'GET 요청만 지원합니다.' })
    return
  }

  const result = await resolveApiRequest(requestUrl.pathname, requestUrl.searchParams)
  sendJson(response, result.statusCode, result.payload)
})

server.listen(port, () => {
  console.log(`Regional industry API server listening on http://127.0.0.1:${port}`)
})
