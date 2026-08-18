<script setup>
import { computed } from 'vue'

const props = defineProps({ studies: { type: Array, required: true } })

const stageOrder = ['정책 발표', '투자협약', '기본·입주협약', '산단 투자 발표', '특화단지 지정', '산단 승인']
const normalizedStage = (stage) => ({
  '기본·입주협약': '기본·입주협약',
  '투자협약': '투자협약',
  '산단 투자 발표': '산단 투자 발표',
  '특화단지 지정': '특화단지 지정',
  '정책 발표': '정책 발표',
  '산단 승인': '산단 승인',
}[stage] ?? stage)

const stageRows = computed(() => {
  const grouped = new Map()
  props.studies.forEach((study) => study.events.forEach((event) => {
    if (event.market?.return20 == null || event.market?.marketReturn20 == null) return
    const stage = normalizedStage(event.stage)
    const item = grouped.get(stage) ?? []
    item.push(Number((event.market.return20 - event.market.marketReturn20).toFixed(2)))
    grouped.set(stage, item)
  }))
  return [...grouped.entries()]
    .map(([stage, values]) => {
      const sorted = [...values].sort((a, b) => a - b)
      const middle = Math.floor(sorted.length / 2)
      const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
      return { stage, count: values.length, median: Number(median.toFixed(2)), values }
    })
    .sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage))
})

function format(value) { return `${value > 0 ? '+' : ''}${value.toFixed(2)}%` }
</script>

<template>
  <section class="stage-evidence">
    <div class="stage-evidence__heading">
      <div>
        <p>STAGE CHECK</p>
        <h2>단계가 깊어져도<br />상승 공식은 확인되지 않았습니다.</h2>
      </div>
      <el-tag type="warning" effect="plain">검증 표본 10건 · 결론 유보</el-tag>
    </div>

    <div class="stage-rows">
      <article v-for="row in stageRows" :key="row.stage">
        <div>
          <span>{{ row.stage }}</span>
          <small>관측 {{ row.count }}건</small>
        </div>
        <strong :class="row.median < 0 ? 'negative' : 'positive'">{{ format(row.median) }}</strong>
        <small>시장 대비 20거래일 중앙값</small>
      </article>
    </div>

    <div class="stage-evidence__note">
      <strong>어떻게 읽어야 하나요?</strong>
      <span>같은 사업의 여러 이벤트는 서로 독립된 사례가 아니고, 단계별 표본도 1~4건입니다. 따라서 현재 값은 ‘경향 탐색’일 뿐 예측 규칙이나 투자 판단 근거가 아닙니다.</span>
    </div>
  </section>
</template>

<style scoped>
.stage-evidence { margin: 0 0 42px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background: #fff; }.stage-evidence__heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; }.stage-evidence__heading p { margin: 0 0 9px; color: #7c3aed; font-size: .7rem; font-weight: 800; letter-spacing: .15em; }.stage-evidence__heading h2 { margin: 0; color: #1e293b; font-size: 1.35rem; line-height: 1.3; letter-spacing: -.055em; }.stage-rows { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 9px; margin-top: 20px; }.stage-rows article { display: grid; gap: 5px; padding: 14px; border-radius: 13px; background: #f8fafc; }.stage-rows article > div { display: flex; justify-content: space-between; gap: 8px; }.stage-rows span { color: #475569; font-size: .76rem; font-weight: 800; }.stage-rows small { color: #94a3b8; font-size: .66rem; line-height: 1.45; }.stage-rows strong { font-size: 1.2rem; letter-spacing: -.05em; }.positive { color: #047857; }.negative { color: #dc2626; }.stage-evidence__note { display: grid; gap: 4px; margin-top: 16px; padding: 13px; border-radius: 11px; background: #fffbeb; color: #78350f; font-size: .76rem; line-height: 1.6; }.stage-evidence__note span { color: #92400e; }
@media (max-width: 620px) { .stage-evidence__heading { display: grid; align-items: start; } }
</style>
