import { resolveApiRequest } from './apiHandlers.js'

const JSON_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}

function getCorsHeaders(request) {
  const allowedOrigin = process.env.CORS_ORIGIN || ''
  const requestOrigin = request.headers.get('origin')

  if (!allowedOrigin || requestOrigin !== allowedOrigin) return {}

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    Vary: 'Origin',
  }
}

function jsonResponse(payload, statusCode, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: { ...JSON_HEADERS, ...headers },
  })
}

export function createVercelApiHandler(pathname) {
  return async function vercelApiHandler(request) {
    const corsHeaders = getCorsHeaders(request)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      })
    }

    if (request.method !== 'GET') {
      return jsonResponse(
        { error: 'METHOD_NOT_ALLOWED', message: 'GET 요청만 지원합니다.' },
        405,
        corsHeaders,
      )
    }

    const requestUrl = new URL(request.url)
    const result = await resolveApiRequest(pathname, requestUrl.searchParams)
    return jsonResponse(result.payload, result.statusCode, corsHeaders)
  }
}
