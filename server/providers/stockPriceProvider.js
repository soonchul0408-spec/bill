import axios from 'axios'

const STOCK_PRICE_URL =
  'http://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo'

function createError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function parseItems(data) {
  const body = data?.response?.body ?? data?.body ?? {}
  return toArray(body?.items?.item ?? body?.items)
}

function parseError(data) {
  const header = data?.response?.header ?? data?.header ?? data?.OpenAPI_ServiceResponse?.cmmMsgHeader
  const code = String(header?.resultCode ?? header?.returnReasonCode ?? '')
  const message = String(header?.resultMsg ?? header?.errMsg ?? '')
  return { code, message }
}

export async function fetchStockPricePayload({ stockCode = '005930', date } = {}) {
  const configuredKey = String(process.env.STOCK_PRICE_API_KEY ?? '').trim()
  // 공공데이터포털은 Encoding·Decoding 키를 모두 노출합니다. axios가 URL 인코딩을 맡도록
  // Encoding 키가 입력된 경우에는 원문으로 한 번 되돌립니다.
  const serviceKey = configuredKey.includes('%') ? decodeURIComponent(configuredKey) : configuredKey
  if (!serviceKey) throw createError('CONFIGURATION', '주식시세 API 인증키가 없어 샘플 데이터를 표시합니다.')

  const response = await axios.get(STOCK_PRICE_URL, {
    timeout: 15000,
    params: {
      serviceKey,
      numOfRows: 100,
      pageNo: 1,
      resultType: 'json',
      ...(date ? { basDt: date } : {}),
      srtnCd: stockCode,
    },
    headers: { Accept: 'application/json' },
  })

  const apiError = parseError(response.data)
  if (apiError.code && apiError.code !== '00') {
    throw createError('UPSTREAM', apiError.message || `주식시세 API 오류: ${apiError.code}`)
  }

  return {
    provider: '금융위원회 주식시세정보',
    sourceUrl: 'https://www.data.go.kr/data/15094808/openapi.do',
    retrievedAt: new Date().toISOString(),
    prices: parseItems(response.data),
  }
}
