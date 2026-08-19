import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchRegionalIndustryPayload } from '../server/providers/regionalIndustryProvider.js'

const hasLofinKey = Boolean(process.env.LOFIN_EXPENDITURE_API_KEY)

test(
  '지방재정365 세부사업별 세출현황 API 연결',
  { skip: !hasLofinKey && 'LOFIN_EXPENDITURE_API_KEY가 없어 실제 API 연결 검사를 건너뜁니다.' },
  async () => {
    const payload = await fetchRegionalIndustryPayload()

    assert.equal(payload.provider, '행정안전부 지방재정365 세부사업별 세출현황')
    assert.equal(payload.sourceUrl, 'https://www.data.go.kr/data/15138857/openapi.do')
    assert.ok(Array.isArray(payload.items), 'API 응답에 items 배열이 필요합니다.')
    assert.ok(payload.items.length > 0, '지방재정365 API에서 세부사업 자료를 받지 못했습니다.')

    const firstItem = payload.items[0]
    assert.ok(firstItem.projectName, '세부사업명이 필요합니다.')
    assert.ok(firstItem.region, '자치단체명이 필요합니다.')
    assert.ok(firstItem.sourceDate, '집행일자가 필요합니다.')
  },
)
