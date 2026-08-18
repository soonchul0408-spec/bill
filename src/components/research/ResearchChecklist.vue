<script setup>
import { computed } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'

const props = defineProps({
  caseId: { type: String, required: true },
  hasDirectCompany: { type: Boolean, required: true },
})

const analysisStore = useAnalysisStore()
const checks = computed(() => [
  { id: 'source', icon: '1', title: '공식 원문', description: '협약·고시 원문을 열어봤어요' },
  { id: 'directness', icon: '2', title: '직접 참여', description: props.hasDirectCompany ? '기업 참여 근거를 확인했어요' : '직접 참여 기업이 없음을 확인했어요' },
  { id: 'disclosure', icon: '3', title: '공시·실적', description: 'DART 공시와 최근 실적을 확인했어요' },
  { id: 'market', icon: '4', title: '시장·업황', description: '시장·업종 흐름과 비교했어요' },
  { id: 'risk', icon: '5', title: '위험 요인', description: '반대 근거와 위험을 적어봤어요' },
])
const completedCount = computed(() =>
  checks.value.filter((check) => analysisStore.isResearchCheckComplete(props.caseId, check.id)).length,
)
</script>

<template>
  <section class="research-checklist" aria-label="개인 리서치 확인 목록">
    <div class="checklist-heading">
      <div>
        <span>내 확인 순서</span>
        <small>체크한 내용은 이 브라우저에 저장됩니다.</small>
      </div>
      <strong>{{ completedCount }}/{{ checks.length }}</strong>
    </div>
    <div class="checklist-items">
      <button
        v-for="check in checks"
        :key="check.id"
        type="button"
        class="check-item"
        :class="{ 'check-item--complete': analysisStore.isResearchCheckComplete(caseId, check.id) }"
        @click="analysisStore.toggleResearchCheck(caseId, check.id)"
      >
        <span class="check-icon">{{ analysisStore.isResearchCheckComplete(caseId, check.id) ? '✓' : check.icon }}</span>
        <span><strong>{{ check.title }}</strong><small>{{ check.description }}</small></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.research-checklist { margin: 0 0 24px; padding: 18px; border: 1px solid #dbe5f1; border-radius: 16px; background: #f8fbff; }.checklist-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 14px; }.checklist-heading div { display: grid; gap: 3px; }.checklist-heading span { color: #334155; font-size: .88rem; font-weight: 800; }.checklist-heading small { color: #94a3b8; font-size: .7rem; }.checklist-heading strong { color: #2563eb; font-size: 1.1rem; }.checklist-items { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }.check-item { display: grid; grid-template-columns: 28px 1fr; align-items: center; gap: 8px; min-width: 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 11px; color: #475569; background: #fff; text-align: left; cursor: pointer; }.check-item:hover { border-color: #93c5fd; }.check-item--complete { border-color: #86efac; background: #f0fdf4; }.check-icon { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 50%; color: #64748b; background: #e2e8f0; font-size: .73rem; font-weight: 900; }.check-item--complete .check-icon { color: #fff; background: #10b981; }.check-item > span:last-child { display: grid; gap: 2px; }.check-item strong { color: #334155; font-size: .73rem; }.check-item small { color: #94a3b8; font-size: .63rem; line-height: 1.35; }
@media (max-width: 900px) { .checklist-items { grid-template-columns: repeat(3, minmax(0, 1fr)); } } @media (max-width: 520px) { .checklist-items { grid-template-columns: 1fr; } }
</style>
