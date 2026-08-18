<script setup>
defineProps({
  signals: { type: Array, required: true },
})
</script>

<template>
  <section class="signal-board" aria-label="기업 연결 검토 신호">
    <div class="signal-board__title">
      <div>
        <span>한눈에 보는 확인 신호</span>
        <small>점수는 투자 판단이 아닌 조사 우선순위 표시입니다.</small>
      </div>
      <el-tag type="warning" effect="plain">추천 아님</el-tag>
    </div>
    <div class="signal-grid">
      <article v-for="signal in signals" :key="signal.label" class="signal-card">
        <div class="signal-card__top">
          <span class="signal-icon" :class="`signal-icon--${signal.type}`">{{ signal.icon }}</span>
          <el-tag size="small" :type="signal.type" effect="plain">{{ signal.level }}</el-tag>
        </div>
        <strong>{{ signal.label }}</strong>
        <div class="signal-meter" aria-hidden="true"><span :style="{ width: `${signal.value}%` }" :class="`signal-meter__fill--${signal.type}`"></span></div>
        <p>{{ signal.detail }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.signal-board { margin: 0 0 24px; padding: 18px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; }.signal-board__title { display: flex; align-items: start; justify-content: space-between; gap: 14px; margin-bottom: 15px; }.signal-board__title div { display: grid; gap: 3px; }.signal-board__title span { color: #334155; font-size: .88rem; font-weight: 800; }.signal-board__title small { color: #94a3b8; font-size: .7rem; }.signal-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }.signal-card { display: grid; gap: 8px; min-width: 0; padding: 13px; border-radius: 12px; background: #f8fafc; }.signal-card__top { display: flex; align-items: center; justify-content: space-between; gap: 4px; }.signal-icon { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 8px; color: #475569; background: #e2e8f0; font-size: .78rem; font-weight: 900; }.signal-icon--success { color: #047857; background: #d1fae5; }.signal-icon--warning { color: #b45309; background: #fef3c7; }.signal-icon--danger { color: #b91c1c; background: #fee2e2; }.signal-card strong { color: #334155; font-size: .78rem; }.signal-meter { height: 5px; overflow: hidden; border-radius: 99px; background: #e2e8f0; }.signal-meter span { display: block; height: 100%; border-radius: inherit; background: #64748b; }.signal-meter__fill--success { background: #10b981 !important; }.signal-meter__fill--warning { background: #f59e0b !important; }.signal-meter__fill--danger { background: #ef4444 !important; }.signal-meter__fill--info { background: #60a5fa !important; }.signal-card p { min-height: 2.7em; margin: 0; color: #64748b; font-size: .68rem; line-height: 1.4; }
@media (max-width: 900px) { .signal-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } } @media (max-width: 520px) { .signal-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.signal-board { padding: 14px; } }
</style>
