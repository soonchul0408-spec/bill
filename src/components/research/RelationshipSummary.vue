<script setup>
import { computed } from 'vue'

const props = defineProps({ studies: { type: Array, required: true } })

const observations = computed(() => props.studies.flatMap((study) =>
  study.events
    .filter((event) => event.market?.return20 != null && event.market?.marketReturn20 != null)
    .map((event) => ({
      study,
      event,
      relative20: Number((event.market.return20 - event.market.marketReturn20).toFixed(2)),
    })),
))

const positiveCount = computed(() => observations.value.filter((item) => item.relative20 > 0).length)
const negativeCount = computed(() => observations.value.filter((item) => item.relative20 < 0).length)
const policyOnlyCount = computed(() => props.studies.filter((study) => !study.market).length)
const medianRelative20 = computed(() => {
  const values = observations.value.map((item) => item.relative20).sort((a, b) => a - b)
  if (!values.length) return 0
  const middle = Math.floor(values.length / 2)
  return values.length % 2 ? values[middle] : Number(((values[middle - 1] + values[middle]) / 2).toFixed(2))
})

function format(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}
</script>

<template>
  <section class="relationship-summary" aria-label="현재 사례에서 확인된 관계 요약">
    <div class="summary-intro">
      <p>WHAT THE CASES SHOW</p>
      <h2>정책만으로는<br />후보를 확정할 수 없습니다.</h2>
      <span>시장 대비 20거래일 반응은 반복 관찰용 수치이며, 정책 효과를 단정하지 않습니다.</span>
    </div>
    <div class="summary-metrics">
      <article>
        <span>가격 검토 이벤트</span>
        <strong>{{ observations.length }}<small>건</small></strong>
        <p>직접·지역 기업 근거가 있는 이벤트</p>
      </article>
      <article>
        <span>시장 대비 상승</span>
        <strong class="positive">{{ positiveCount }}<small>건</small></strong>
        <p>20거래일 기준</p>
      </article>
      <article>
        <span>시장 대비 하락</span>
        <strong class="negative">{{ negativeCount }}<small>건</small></strong>
        <p>20거래일 기준</p>
      </article>
      <article>
        <span>중앙값 반응</span>
        <strong :class="medianRelative20 < 0 ? 'negative' : 'positive'">{{ format(medianRelative20) }}</strong>
        <p>극단값 영향을 줄인 참고값</p>
      </article>
    </div>
    <div class="summary-conclusion">
      <strong>현재 결론</strong>
      <span>정책 발표·지정 단계는 ‘조사 시작 신호’입니다. {{ policyOnlyCount }}개 사례처럼 기업 계약·공시가 없으면 종목 후보를 만들지 않습니다.</span>
    </div>
  </section>
</template>

<style scoped>
.relationship-summary { display: grid; grid-template-columns: .95fr 1.55fr; gap: 14px; margin: 26px 0 42px; padding: 24px; border: 1px solid #dbeafe; border-radius: 20px; background: linear-gradient(130deg, #eff6ff, #fff 62%); }.summary-intro p { margin: 0 0 9px; color: #2563eb; font-size: .7rem; font-weight: 800; letter-spacing: .15em; }.summary-intro h2 { margin: 0; color: #172554; font-size: 1.45rem; line-height: 1.28; letter-spacing: -.06em; }.summary-intro span { display: block; margin-top: 12px; color: #64748b; font-size: .76rem; line-height: 1.6; }.summary-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }.summary-metrics article { display: grid; align-content: center; min-height: 112px; padding: 14px; border: 1px solid #dbeafe; border-radius: 13px; background: rgb(255 255 255 / .85); }.summary-metrics span, .summary-metrics p { color: #64748b; font-size: .68rem; line-height: 1.45; }.summary-metrics strong { margin: 5px 0; color: #1e3a8a; font-size: 1.55rem; letter-spacing: -.07em; }.summary-metrics strong small { margin-left: 3px; font-size: .72rem; }.summary-metrics .positive { color: #047857; }.summary-metrics .negative { color: #dc2626; }.summary-metrics p { margin: 0; }.summary-conclusion { grid-column: 1 / -1; display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 10px; background: #172554; color: #dbeafe; font-size: .78rem; line-height: 1.55; }.summary-conclusion strong { color: #99f6e4; white-space: nowrap; }
@media (max-width: 860px) { .relationship-summary { grid-template-columns: 1fr; }.summary-metrics { grid-template-columns: repeat(2, 1fr); } }.summary-conclusion { align-items: start; }
</style>
