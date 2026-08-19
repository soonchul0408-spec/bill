import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchStockPricePayload } from '../server/providers/stockPriceProvider.js'

test(
  '금융위원회 주식시세 API 연결',
  { skip: !process.env.STOCK_PRICE_API_KEY && 'STOCK_PRICE_API_KEY가 없어 실제 API 연결 검사를 건너뜁니다.' },
  async () => {
    const payload = await fetchStockPricePayload()
    assert.equal(payload.provider, '금융위원회 주식시세정보')
    assert.ok(Array.isArray(payload.prices))
    assert.ok(payload.prices.length > 0, '주식시세 API에서 삼성전자 시세를 받지 못했습니다.')
    assert.ok(payload.prices[0].itmsNm || payload.prices[0].srtnCd)
  },
)
