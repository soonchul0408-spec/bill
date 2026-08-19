import axios from 'axios'

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export async function fetchLatestStockPrice(stockCode) {
  const response = await axios.get(`${API_BASE_URL}/stocks/prices`, {
    params: { stockCode },
    headers: { Accept: 'application/json' },
    timeout: 15000,
  })

  const price = response.data?.prices?.[0]
  if (!price) throw new Error('주식시세 API 응답에 종가 데이터가 없습니다.')

  return {
    stockCode: String(price.srtnCd ?? stockCode ?? ''),
    companyName: String(price.itmsNm ?? ''),
    close: Number(String(price.clpr ?? '').replace(/,/g, '')),
    date: String(price.basDt ?? ''),
  }
}
