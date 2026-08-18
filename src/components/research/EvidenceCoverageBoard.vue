<script setup>
import { computed } from 'vue'

const props = defineProps({ studies: { type: Array, required: true } })
const stages = ['정책 발표', '투자협약', '기본·입주협약', '산단 투자 발표', '특화단지 지정', '산단 승인']
const target = 10

const rows = computed(() => stages.map((stage) => {
  const count = props.studies.reduce((total, study) => total + study.events.filter((event) =>
    event.stage === stage && event.market?.return20 != null,
  ).length, 0)
  return { stage, count, percentage: Math.min(100, Math.round((count / target) * 100)) }
}))
</script>

<template>
  <section class="coverage-board">
    <div class="coverage-board__head">
      <div>
        <p>RESEARCH COVERAGE</p>
        <h2>아직은 결론보다<br />데이터를 더 모을 단계입니다.</h2>
      </div>
      <div class="coverage-badge"><strong>목표</strong><span>단계별 10건</span></div>
    </div>
    <div class="coverage-list">
      <article v-for="row in rows" :key="row.stage">
        <div class="coverage-label"><span>{{ row.stage }}</span><strong>{{ row.count }} / {{ target }}</strong></div>
        <div class="coverage-track"><i :style="{ width: `${row.percentage}%` }" /></div>
      </article>
    </div>
    <p class="coverage-note">목표 수를 채워도 수익을 보장하지 않습니다. 같은 사업의 반복 이벤트는 한 묶음으로 별도 관리해, 표본 수를 부풀리지 않습니다.</p>
  </section>
</template>

<style scoped>
.coverage-board { margin: 0 0 42px; padding: 24px; border-radius: 20px; color: #fff; background: linear-gradient(135deg, #312e81, #1e3a8a); }.coverage-board__head { display: flex; justify-content: space-between; align-items: start; gap: 18px; }.coverage-board__head p { margin: 0 0 9px; color: #c4b5fd; font-size: .7rem; font-weight: 800; letter-spacing: .15em; }.coverage-board__head h2 { margin: 0; color: #fff; font-size: 1.35rem; line-height: 1.3; letter-spacing: -.055em; }.coverage-badge { display: grid; gap: 3px; min-width: 116px; padding: 12px; border: 1px solid rgb(255 255 255 / .2); border-radius: 12px; background: rgb(15 23 42 / .25); }.coverage-badge strong { color: #a7f3d0; font-size: .68rem; }.coverage-badge span { color: #e0e7ff; font-size: .77rem; font-weight: 800; }.coverage-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 18px; margin-top: 22px; }.coverage-list article { display: grid; gap: 7px; }.coverage-label { display: flex; justify-content: space-between; gap: 8px; color: #e0e7ff; font-size: .74rem; }.coverage-label strong { color: #fff; }.coverage-track { height: 7px; overflow: hidden; border-radius: 99px; background: rgb(255 255 255 / .16); }.coverage-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #a7f3d0, #5eead4); }.coverage-note { margin: 20px 0 0; color: #c7d2fe; font-size: .74rem; line-height: 1.6; }
@media (max-width: 700px) { .coverage-board__head { display: grid; }.coverage-list { grid-template-columns: 1fr; } }
</style>
