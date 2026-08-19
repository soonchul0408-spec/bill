<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
})

const emit = defineEmits(['select'])

const timelineItems = computed(() =>
  [...props.items].sort((a, b) => String(a.proposedAt).localeCompare(String(b.proposedAt))),
)

const stageColors = {
  발의: 'info',
  입법예고: 'warning',
  '상임위 심사': 'warning',
  '본회의 심사': 'primary',
  통과: 'success',
  '계류·폐기': 'danger',
}

function stageColor(stage) {
  return stageColors[stage] ?? 'info'
}
</script>

<template>
  <section class="legislation-timeline" aria-label="법안 제안일 시계열">
    <div class="timeline-heading">
      <div>
        <p>TIME SERIES</p>
        <h2>제안일 흐름에서 법안 찾기</h2>
      </div>
      <span>{{ timelineItems.length }}건 · 점을 클릭하면 상세 정보가 열립니다</span>
    </div>

    <div v-if="timelineItems.length" class="timeline-scroll">
      <div class="timeline-scale" :style="{ '--item-count': timelineItems.length }">
        <div class="timeline-range">
          <span>오래된 제안</span>
          <span>최근 제안</span>
        </div>
        <div class="timeline-line" aria-hidden="true"></div>
        <button
          v-for="(item, index) in timelineItems"
          :key="item.id"
          type="button"
          class="timeline-item"
          :class="[`timeline-item--${stageColor(item.stage)}`, { 'timeline-item--top': index % 2 === 0 }]"
          :style="{ '--position': timelineItems.length === 1 ? 50 : (index / (timelineItems.length - 1)) * 100 }"
          @click="emit('select', item)"
        >
          <span class="timeline-item__date">{{ item.proposedAt }}</span>
          <span class="timeline-item__dot" aria-hidden="true"></span>
          <span class="timeline-item__card">
            <el-tag size="small" :type="stageColor(item.stage)" effect="plain">{{ item.stage }}</el-tag>
            <strong>{{ item.billName }}</strong>
            <small>{{ item.region }} · {{ item.category }}</small>
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.legislation-timeline { padding: 26px; border: 1px solid #dbe7f3; border-radius: 20px; background: linear-gradient(145deg, #f8fbff, #fff 62%); }
.timeline-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; }.timeline-heading p { margin: 0 0 7px; color: #2563eb; font-size: .68rem; font-weight: 900; letter-spacing: .14em; }.timeline-heading h2 { margin: 0; color: #172554; font-size: 1.2rem; letter-spacing: -.045em; }.timeline-heading > span { color: #64748b; font-size: .74rem; }
.timeline-scroll { overflow-x: auto; padding: 28px 0 12px; }.timeline-scale { position: relative; min-width: max(720px, calc(var(--item-count) * 172px)); height: 300px; }.timeline-range { display: flex; justify-content: space-between; color: #94a3b8; font-size: .7rem; font-weight: 800; }.timeline-line { position: absolute; top: 150px; right: 2%; left: 2%; height: 3px; border-radius: 99px; background: linear-gradient(90deg, #cbd5e1, #60a5fa, #0f766e); }
.timeline-item { position: absolute; left: clamp(3%, calc(var(--position) * .94%), 97%); width: 162px; padding: 0; border: 0; color: inherit; background: transparent; text-align: left; cursor: pointer; transform: translateX(-50%); }.timeline-item__date { position: absolute; top: 132px; left: 50%; color: #64748b; font-size: .68rem; font-weight: 800; white-space: nowrap; transform: translateX(-50%); }.timeline-item__dot { position: absolute; z-index: 1; top: 140px; left: 50%; width: 20px; height: 20px; border: 5px solid #60a5fa; border-radius: 50%; background: #fff; transform: translateX(-50%); transition: transform .18s ease, box-shadow .18s ease; }.timeline-item__card { position: absolute; display: grid; gap: 6px; width: 162px; padding: 12px; border: 1px solid #dbe7f3; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px rgb(30 58 138 / 6%); }.timeline-item--top .timeline-item__card { bottom: 170px; }.timeline-item:not(.timeline-item--top) .timeline-item__card { top: 170px; }.timeline-item strong { display: -webkit-box; overflow: hidden; color: #334155; font-size: .74rem; font-weight: 800; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.timeline-item small { overflow: hidden; color: #94a3b8; font-size: .65rem; text-overflow: ellipsis; white-space: nowrap; }.timeline-item:hover .timeline-item__dot, .timeline-item:focus-visible .timeline-item__dot { box-shadow: 0 0 0 6px rgb(37 99 235 / 15%); transform: translateX(-50%) scale(1.16); }.timeline-item:focus-visible { outline: none; }.timeline-item--success .timeline-item__dot { border-color: #10b981; }.timeline-item--warning .timeline-item__dot { border-color: #f59e0b; }.timeline-item--danger .timeline-item__dot { border-color: #ef4444; }
@media (max-width: 680px) { .legislation-timeline { padding: 20px; }.timeline-heading { align-items: start; display: grid; }.timeline-scroll { margin-right: -20px; margin-left: -20px; padding-right: 20px; padding-left: 20px; } }
</style>
