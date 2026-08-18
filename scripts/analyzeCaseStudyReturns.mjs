import { CASE_STUDIES } from '../src/data/caseStudies.js'

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function summarize(label, observations) {
  const excess5 = observations.map((item) => item.excess5)
  const excess20 = observations.map((item) => item.excess20)
  const positive20 = excess20.filter((value) => value > 0).length

  return {
    label,
    count: observations.length,
    medianExcess5: Number(median(excess5).toFixed(2)),
    medianExcess20: Number(median(excess20).toFixed(2)),
    positive20Ratio: Number(((positive20 / observations.length) * 100).toFixed(1)),
  }
}

function normalizePolicyStage(stage) {
  if (['정책 발표', '후보지 발표'].includes(stage)) return '발표·후보지'
  if (['특화단지 지정', '산단 승인', '국회 의결', '법 시행', '기본계획'].includes(stage)) return '지정·승인'
  if (['투자협약', '기본·입주협약', '업무협약', '산단 투자 발표'].includes(stage)) return '협약·투자'
  return '기타 정책 단계'
}

const observations = CASE_STUDIES.flatMap((study) =>
  study.events
    .filter((event) => event.market?.return20 != null && event.market?.marketReturn20 != null)
    .map((event) => ({
      studyId: study.id,
      stage: event.stage,
      policyStageGroup: normalizePolicyStage(event.stage),
      relationGroup: study.statusType === 'success' ? '직접 협약·투자 근거' : '지역 입지·협력 근거',
      excess5: Number((event.market.return5 - event.market.marketReturn5).toFixed(2)),
      excess20: Number((event.market.return20 - event.market.marketReturn20).toFixed(2)),
    })),
)

const summaries = [
  summarize('전체 시장 관찰값', observations),
  ...['직접 협약·투자 근거', '지역 입지·협력 근거']
    .map((group) => ({ group, values: observations.filter((item) => item.relationGroup === group) }))
    .filter(({ values }) => values.length)
    .map(({ group, values }) => summarize(group, values)),
]

const stageSummaries = [...new Set(observations.map((item) => item.policyStageGroup))]
  .map((group) => ({ group, values: observations.filter((item) => item.policyStageGroup === group) }))
  .map(({ group, values }) => summarize(group, values))

console.table(summaries)
console.table(stageSummaries)
console.log('주의: 시장 대비 단순 수익률의 기술통계입니다. 표본이 작고 업황·실적·공시 등 교란요인을 통제하지 않아 예측 또는 인과관계로 해석할 수 없습니다.')
