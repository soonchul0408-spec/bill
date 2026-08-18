<script setup>
import { computed } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'

const props = defineProps({ caseId: { type: String, required: true } })
const analysisStore = useAnalysisStore()
const note = computed(() => analysisStore.getProjectNote(props.caseId))

function update(field, value) {
  analysisStore.updateProjectNote(props.caseId, { ...note.value, [field]: value })
}
</script>

<template>
  <section class="research-journal">
    <div>
      <p>MY RESEARCH NOTE</p>
      <h3>내 판단 근거를 남겨보세요.</h3>
      <span>자동 저장됩니다. 매수·매도 추천이 아니라 나중에 스스로의 판단을 복기하는 노트입니다.</span>
    </div>
    <div class="journal-fields">
      <label>
        <span>왜 이 사업을 살펴보나요?</span>
        <el-input :model-value="note.interestReason" type="textarea" :rows="2" placeholder="예: 실제 투자협약과 기업 공시가 이어지는지 확인하고 싶다" @update:model-value="update('interestReason', $event)" />
      </label>
      <label>
        <span>내가 확인한 사실은?</span>
        <el-input :model-value="note.judgmentBasis" type="textarea" :rows="2" placeholder="예: 정책 원문과 기업의 투자 발표를 확인했다" @update:model-value="update('judgmentBasis', $event)" />
      </label>
      <label>
        <span>보류하거나 제외할 조건은?</span>
        <el-input :model-value="note.concerns" type="textarea" :rows="2" placeholder="예: 공시가 없거나 사업 일정이 미뤄지면 다시 확인한다" @update:model-value="update('concerns', $event)" />
      </label>
      <label>
        <span>다음에 확인할 것은?</span>
        <el-input :model-value="note.nextChecks" type="textarea" :rows="2" placeholder="예: 다음 분기 투자·수주 공시와 실적 발표" @update:model-value="update('nextChecks', $event)" />
      </label>
    </div>
  </section>
</template>

<style scoped>
.research-journal { display: grid; grid-template-columns: .8fr 1.2fr; gap: 20px; margin: 24px 0; padding: 21px; border: 1px solid #bbf7d0; border-radius: 16px; background: linear-gradient(135deg, #f0fdf4, #fff); }.research-journal p { margin: 0 0 9px; color: #15803d; font-size: .7rem; font-weight: 800; letter-spacing: .14em; }.research-journal h3 { margin: 0; color: #14532d; font-size: 1.1rem; letter-spacing: -.04em; }.research-journal > div > span { display: block; margin-top: 10px; color: #4b6b57; font-size: .76rem; line-height: 1.6; }.journal-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.journal-fields label { display: grid; gap: 6px; }.journal-fields label > span { color: #3f5f49; font-size: .72rem; font-weight: 800; }.journal-fields :deep(.el-textarea__inner) { border-color: #d1fae5; background: rgb(255 255 255 / .9); font-size: .78rem; line-height: 1.55; }
@media (max-width: 760px) { .research-journal, .journal-fields { grid-template-columns: 1fr; } }
</style>
