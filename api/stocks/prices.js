import { createVercelApiHandler } from '../../server/vercelHandler.js'

const handler = createVercelApiHandler('/api/stocks/prices')

export function GET(request) {
  return handler(request)
}

export function OPTIONS(request) {
  return handler(request)
}
