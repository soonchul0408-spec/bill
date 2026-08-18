<script setup>
import { computed } from 'vue'

const props = defineProps({
  market: { type: Object, required: true },
  events: { type: Array, required: true },
})

const plottedEvents = computed(() => props.events.filter((event) => event.market?.close))
const values = computed(() => plottedEvents.value.map((event) => event.market.close))
const range = computed(() => {
  const minimum = Math.min(...values.value)
  const maximum = Math.max(...values.value)
  const padding = Math.max((maximum - minimum) * 0.18, maximum * 0.035)
  return { min: minimum - padding, max: maximum + padding }
})

function point(index, value) {
  const width = 640
  const height = 214
  const x = plottedEvents.value.length === 1 ? width / 2 : 34 + (index * (width - 68)) / (plottedEvents.value.length - 1)
  const y = 22 + ((range.value.max - value) / (range.value.max - range.value.min)) * (height - 62)
  return { x, y }
}

const points = computed(() =>
  plottedEvents.value.map((event, index) => ({ ...point(index, event.market.close), event })),
)
const linePoints = computed(() => points.value.map(({ x, y }) => `${x},${y}`).join(' '))
const priceFormatter = new Intl.NumberFormat('ko-KR')

function formatPrice(value) {
  return `${priceFormatter.format(value)}원`
}

function formatPercent(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

function excessReturn(event, period) {
  return event.market[`return${period}`] - event.market[`marketReturn${period}`]
}
</script>

<template>
  <div class="reaction-chart">
    <div class="reaction-chart__header">
      <div>
        <strong>{{ market.companyName }} 이벤트별 종가</strong>
        <small>종목코드 {{ market.stockCode }} · 일별 종가 · KOSPI 비교</small>
      </div>
      <div class="source-links">
        <a :href="market.sourceUrl" target="_blank" rel="noopener noreferrer">{{ market.sourceTitle }} ↗</a>
        <a :href="market.benchmarkUrl" target="_blank" rel="noopener noreferrer">{{ market.benchmarkTitle }} ↗</a>
      </div>
    </div>

    <div class="policy-impact-title">
      <span>정책 이벤트</span>
      <strong>→</strong>
      <span>기업·시장 반응</span>
    </div>
    <p class="event-chart-legend">
      <span aria-hidden="true"></span>
      각 점은 정책 이벤트 당일 종가입니다. 점선은 사건 순서를 잇는 표시이며, 연속 주가 시계열이 아닙니다.
    </p>
    <div class="policy-impact-grid">
      <article v-for="event in plottedEvents" :key="`${event.date}-impact`" class="policy-impact-card">
        <div class="policy-event">
          <span>{{ event.date }}</span>
          <strong>{{ event.stage }}</strong>
          <p>{{ event.title }}</p>
        </div>
        <div class="policy-result">
          <span>20거래일</span>
          <strong :class="{ 'is-negative': excessReturn(event, 20) < 0 }">
            시장 대비 {{ formatPercent(excessReturn(event, 20)) }}
          </strong>
          <small>기업 {{ formatPercent(event.market.return20) }} · KOSPI {{ formatPercent(event.market.marketReturn20) }}</small>
        </div>
      </article>
    </div>

    <svg viewBox="0 0 640 214" role="img" :aria-label="`${market.companyName} 이벤트별 종가 흐름`">
      <defs>
        <linearGradient id="event-line" x1="0" x2="1">
          <stop stop-color="#2563eb" />
          <stop offset="1" stop-color="#0f766e" />
        </linearGradient>
      </defs>
      <line x1="34" y1="174" x2="606" y2="174" class="baseline" />
      <line x1="34" y1="98" x2="606" y2="98" class="guide" />
      <polyline :points="linePoints" fill="none" stroke="url(#event-line)" stroke-width="4" stroke-dasharray="8 8" stroke-linecap="round" stroke-linejoin="round" />
      <g v-for="pointItem in points" :key="pointItem.event.date">
        <circle :cx="pointItem.x" :cy="pointItem.y" r="8" fill="#fff" stroke="#0f766e" stroke-width="5" />
        <text :x="pointItem.x" :y="pointItem.y - 16" text-anchor="middle" class="price-label">
          {{ formatPrice(pointItem.event.market.close) }}
        </text>
        <text :x="pointItem.x" y="198" text-anchor="middle" class="date-label">
          {{ pointItem.event.date.slice(2).replaceAll('.', '.') }}
        </text>
        <text :x="pointItem.x" y="212" text-anchor="middle" class="stage-label">
          {{ pointItem.event.stage }}
        </text>
      </g>
    </svg>

    <div class="reaction-metrics">
      <div v-for="event in plottedEvents" :key="`${event.date}-metrics`" class="reaction-metric">
        <span>{{ event.date }} · {{ event.stage }}</span>
        <strong>{{ formatPrice(event.market.close) }}</strong>
        <small :class="{ 'is-negative': event.market.return5 < 0 }">5거래일 {{ formatPercent(event.market.return5) }}</small>
        <small :class="{ 'is-negative': event.market.return20 < 0 }">20거래일 {{ formatPercent(event.market.return20) }}</small>
        <small :class="{ 'is-negative': excessReturn(event, 5) < 0 }">시장 대비 5일 {{ formatPercent(excessReturn(event, 5)) }}</small>
        <small :class="{ 'is-negative': excessReturn(event, 20) < 0 }">시장 대비 20일 {{ formatPercent(excessReturn(event, 20)) }}</small>
        <span v-if="event.market.volumeRatio != null">거래량 평균 대비 {{ event.market.volumeRatio }}배</span>
        <span v-if="event.market.range20 != null">20일 가격 범위 {{ event.market.range20 }}%</span>
      </div>
    </div>
    <p class="reaction-note">{{ market.note }} 확인일 {{ market.verifiedAt }}.</p>
  </div>
</template>

<style scoped>
.reaction-chart { padding: 20px; border: 1px solid #dce8f5; border-radius: 16px; background: linear-gradient(180deg, #f8fbff, #fff); }
.reaction-chart__header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }.reaction-chart__header > div:first-child { display: grid; gap: 4px; }.reaction-chart__header strong { color: #1e3a5f; font-size: .93rem; }.reaction-chart__header small { color: #7c8da4; font-size: .74rem; }.source-links { display: grid; justify-items: end; gap: 5px; }.reaction-chart__header a { color: #2563eb; font-size: .72rem; font-weight: 800; white-space: nowrap; }
.policy-impact-title { display: flex; align-items: center; gap: 9px; margin: 20px 0 10px; color: #1e3a5f; font-size: .84rem; font-weight: 800; }.policy-impact-title strong { color: #f59e0b; font-size: 1.2rem; }.policy-impact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }.policy-impact-card { display: grid; grid-template-columns: 1.15fr .85fr; overflow: hidden; border: 1px solid #dbeafe; border-radius: 13px; background: #fff; }.policy-event { display: grid; gap: 4px; padding: 13px; background: #eff6ff; }.policy-event span, .policy-result span { color: #64748b; font-size: .68rem; font-weight: 800; }.policy-event strong { color: #1e40af; font-size: .93rem; }.policy-event p { margin: 0; color: #475569; font-size: .72rem; line-height: 1.45; }.policy-result { display: grid; align-content: center; gap: 5px; padding: 13px; }.policy-result strong { color: #047857; font-size: .92rem; letter-spacing: -.04em; }.policy-result strong.is-negative { color: #dc2626; }.policy-result small { color: #64748b; font-size: .64rem; line-height: 1.4; }
.event-chart-legend { display: flex; align-items: flex-start; gap: 7px; margin: 0 0 12px; color: #64748b; font-size: .7rem; line-height: 1.5; }.event-chart-legend span { display: inline-block; flex: 0 0 auto; width: 18px; margin-top: 5px; border-top: 2px dashed #2563eb; }
svg { display: block; width: 100%; margin: 14px 0 2px; overflow: visible; }.baseline { stroke: #cbd5e1; stroke-width: 1.5; }.guide { stroke: #e2e8f0; stroke-dasharray: 4 5; }.price-label { fill: #334155; font-size: 11px; font-weight: 800; }.date-label { fill: #64748b; font-size: 10px; font-weight: 700; }.stage-label { fill: #94a3b8; font-size: 9px; }
.reaction-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-top: 10px; }.reaction-metric { display: grid; gap: 3px; padding: 10px; border-radius: 10px; background: #fff; }.reaction-metric span { color: #64748b; font-size: .7rem; }.reaction-metric strong { color: #1e293b; font-size: .82rem; }.reaction-metric small { color: #047857; font-size: .7rem; font-weight: 800; }.reaction-metric small.is-negative { color: #dc2626; }.reaction-metric span:nth-last-child(-n + 2) { color: #94a3b8; font-size: .66rem; }.reaction-note { margin: 13px 0 0; color: #7c8da4; font-size: .72rem; line-height: 1.55; }
@media (max-width: 520px) { .reaction-chart { padding: 15px; }.reaction-chart__header { display: grid; }.source-links { justify-items: start; }.policy-impact-card { grid-template-columns: 1fr; }.price-label { font-size: 9px; }.date-label { font-size: 8px; }.stage-label { font-size: 7px; } }
</style>
