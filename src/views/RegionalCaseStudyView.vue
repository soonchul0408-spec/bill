<script setup>
import { computed, ref } from 'vue'
import { CASE_STUDIES, CASE_STUDY_METHOD } from '@/data/regionalCaseStudies'

const selectedId = ref(CASE_STUDIES[0].id)
const selectedCase = computed(() => CASE_STUDIES.find((item) => item.id === selectedId.value))
const chartBounds = computed(() => {
  const values = selectedCase.value.analysis.series.flatMap((item) => [item[1], item[2], 0])
  const min = Math.floor(Math.min(...values) / 5) * 5 - 2
  const max = Math.ceil(Math.max(...values) / 5) * 5 + 2
  return { min, max }
})
const chartTicks = computed(() => {
  const { min, max } = chartBounds.value
  return [min, Math.round((min + max) / 2), max]
})

const chart = { width: 680, height: 270, left: 52, right: 20, top: 18, bottom: 36 }

function chartX(day) {
  return chart.left + ((day + 10) / 30) * (chart.width - chart.left - chart.right)
}

function chartY(value) {
  const { min, max } = chartBounds.value
  return chart.top + ((max - value) / (max - min)) * (chart.height - chart.top - chart.bottom)
}

function chartPoints(index) {
  return selectedCase.value.analysis.series
    .map((item) => `${chartX(item[0])},${chartY(item[index])}`)
    .join(' ')
}

function signed(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

const eventType = {
  law: 'primary',
  plan: 'warning',
  construction: 'success',
  completion: 'info',
}
</script>

<template>
  <div class="case-study-page">
    <nav class="analysis-tabs" aria-label="지역산업 분석 카테고리">
      <a href="/regional-industry">지역별 산업</a>
      <a href="/legislation">법안별</a>
      <a href="/regional-case-studies" class="is-active" aria-current="page">과거 사례 연구</a>
    </nav>

    <section class="case-hero">
      <p class="eyebrow">HISTORICAL CASE STUDIES</p>
      <h1>정책부터 완공까지,<br />과거 사례로 검증합니다.</h1>
      <p>
        완료된 지역 개발 사례의 정책·계획·공사·이전 이벤트와 전후 30거래일의 시장 조정 수익률을 함께
        비교합니다.
      </p>
    </section>

    <el-alert class="data-note" type="info" :closable="false" show-icon>
      <template #title>검증 결과는 투자 추천이 아닙니다.</template>
      공개 일별 종가와 KOSPI를 이용한 시장 조정 비교이며, 개별 수주·실적·원자재 가격 등 동시 발생
      요인을 모두 제거하지는 못합니다.
    </el-alert>

    <section class="case-layout">
      <aside class="case-picker" aria-label="과거 사례 선택">
        <button
          v-for="item in CASE_STUDIES"
          :key="item.id"
          type="button"
          :class="{ selected: selectedId === item.id }"
          @click="selectedId = item.id"
        >
          <small>{{ item.region }} · {{ item.category }}</small>
          <strong>{{ item.title }}</strong>
          <span>{{ item.company }} ({{ item.ticker }})</span>
        </button>
      </aside>

      <article v-if="selectedCase" class="case-detail">
        <header>
          <div>
            <p>{{ selectedCase.region }} · {{ selectedCase.category }}</p>
            <h2>{{ selectedCase.title }}</h2>
          </div>
          <el-tag type="warning" effect="plain">{{ selectedCase.status }}</el-tag>
        </header>

        <dl class="case-facts">
          <div>
            <dt>정책·법률</dt>
            <dd>{{ selectedCase.law }}</dd>
          </div>
          <div>
            <dt>비교 기업</dt>
            <dd>{{ selectedCase.company }} · {{ selectedCase.ticker }}</dd>
          </div>
          <div>
            <dt>연결 근거</dt>
            <dd>{{ selectedCase.companyRelation }}</dd>
          </div>
        </dl>

        <p class="case-summary">{{ selectedCase.summary }}</p>

        <section class="timeline-section">
          <div class="section-title">
            <span>EVENT TIMELINE</span>
            <h3>검증할 핵심 시점</h3>
          </div>
          <div class="event-roadmap" :aria-label="`${selectedCase.title} 단계별 타임라인`">
            <div
              v-for="(event, index) in selectedCase.events"
              :key="`${event.date}-${event.label}`"
              class="event-step"
              :class="`event-step--${event.kind}`"
            >
              <span
                v-if="index < selectedCase.events.length - 1"
                class="event-connector"
                aria-hidden="true"
              ></span>
              <span class="event-step__number">STEP {{ String(index + 1).padStart(2, '0') }}</span>
              <span class="event-step__dot" aria-hidden="true"></span>
              <strong>{{ event.label }}</strong>
              <small>{{ event.date }}</small>
              <el-tag size="small" :type="eventType[event.kind]" effect="plain">
                {{
                  event.kind === 'law'
                    ? '법·정책'
                    : event.kind === 'plan'
                      ? '계획·지정'
                      : event.kind === 'construction'
                        ? '공사·조성'
                        : '이전·준공'
                }}
              </el-tag>
            </div>
          </div>

          <div class="return-window" aria-label="수익률 검증 구간">
            <span>이벤트 전 10거래일</span><i aria-hidden="true"></i><strong>이벤트일</strong
            ><i aria-hidden="true"></i><span>이벤트 후 20거래일</span>
            <small>각 단계에서 이 구간의 초과수익률과 거래량 변화를 비교합니다.</small>
          </div>
        </section>

        <section class="return-chart-section">
          <div class="section-title">
            <span>MARKET-ADJUSTED RETURN</span>
            <h3>{{ selectedCase.analysis.eventLabel }} 전후 시계열</h3>
          </div>
          <div class="chart-legend" aria-label="차트 범례">
            <span><i class="company-line"></i>{{ selectedCase.company }}</span>
            <span><i class="market-line"></i>KOSPI</span>
            <small>기준일은 이벤트 10거래일 전 = 0%</small>
          </div>
          <svg
            class="return-chart"
            :viewBox="`0 0 ${chart.width} ${chart.height}`"
            role="img"
            :aria-label="`${selectedCase.company}과 KOSPI의 이벤트 전후 수익률 비교`"
          >
            <line
              v-for="tick in chartTicks"
              :key="tick"
              :x1="chart.left"
              :x2="chart.width - chart.right"
              :y1="chartY(tick)"
              :y2="chartY(tick)"
              class="chart-grid"
            />
            <text
              v-for="tick in chartTicks"
              :key="`label-${tick}`"
              :x="chart.left - 8"
              :y="chartY(tick) + 4"
              class="chart-label"
              text-anchor="end"
            >
              {{ tick }}%
            </text>
            <line
              :x1="chartX(0)"
              :x2="chartX(0)"
              :y1="chart.top"
              :y2="chart.height - chart.bottom"
              class="event-line"
            />
            <polyline :points="chartPoints(2)" class="market-series" fill="none" />
            <polyline :points="chartPoints(1)" class="company-series" fill="none" />
            <circle
              :cx="chartX(0)"
              :cy="chartY(selectedCase.analysis.series[10][1])"
              r="4"
              class="company-point"
            />
            <text :x="chartX(-10)" :y="chart.height - 10" class="chart-label" text-anchor="middle">
              -10일
            </text>
            <text :x="chartX(0)" :y="chart.height - 10" class="event-label" text-anchor="middle">
              이벤트일
            </text>
            <text :x="chartX(20)" :y="chart.height - 10" class="chart-label" text-anchor="middle">
              +20일
            </text>
          </svg>

          <dl class="return-metrics">
            <div>
              <dt>기업 수익률</dt>
              <dd>{{ signed(selectedCase.analysis.rawReturn) }}</dd>
            </div>
            <div>
              <dt>KOSPI 수익률</dt>
              <dd>{{ signed(selectedCase.analysis.marketReturn) }}</dd>
            </div>
            <div>
              <dt>누적 초과수익률</dt>
              <dd
                :class="{
                  positive: selectedCase.analysis.car > 0,
                  negative: selectedCase.analysis.car < 0,
                }"
              >
                {{ signed(selectedCase.analysis.car) }}
              </dd>
            </div>
            <div>
              <dt>이벤트 당일 초과수익률</dt>
              <dd
                :class="{
                  positive: selectedCase.analysis.eventDayAbnormalReturn > 0,
                  negative: selectedCase.analysis.eventDayAbnormalReturn < 0,
                }"
              >
                {{ signed(selectedCase.analysis.eventDayAbnormalReturn) }}
              </dd>
            </div>
          </dl>
          <small class="source-note"
            >분석 창: {{ selectedCase.analysis.window }} · 공개 일별 종가와 KOSPI 종가 기준 · 데이터
            수집일: 2026.08.16</small
          >
        </section>

        <section class="insight-box">
          <span>이 사례에서 확인할 점</span>
          <strong>{{ selectedCase.insight }}</strong>
        </section>

        <footer>
          <a
            v-for="source in selectedCase.sources"
            :key="source.url"
            :href="source.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ source.label }} ↗
          </a>
        </footer>
      </article>
    </section>

    <section class="method-section">
      <p class="eyebrow">BACKTEST RULE</p>
      <h2>세 사례에 같은 기준을 적용합니다</h2>
      <ol>
        <li v-for="method in CASE_STUDY_METHOD" :key="method">{{ method }}</li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.case-study-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 40px 24px 88px;
  color: #172033;
}
.analysis-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.analysis-tabs a {
  padding: 9px 14px;
  border-radius: 999px;
  color: #61718a;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
}
.analysis-tabs a.is-active {
  color: #fff;
  background: #1d4ed8;
}
.case-hero {
  padding: 50px;
  border-radius: 28px;
  color: #fff;
  background: linear-gradient(130deg, #172554, #1e3a8a 55%, #0f766e);
}
.eyebrow {
  margin: 0 0 10px;
  color: #60a5fa;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
.case-hero h1 {
  margin: 0;
  font-size: clamp(2.35rem, 5vw, 4.15rem);
  letter-spacing: -0.07em;
  line-height: 1.1;
}
.case-hero > p:last-child {
  max-width: 730px;
  margin: 20px 0 0;
  color: #dbeafe;
  line-height: 1.75;
}
.data-note {
  margin-top: 24px;
}
.case-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 24px;
  margin-top: 28px;
}
.case-picker {
  display: grid;
  align-content: start;
  gap: 10px;
}
.case-picker button {
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px solid #e5eaf2;
  border-radius: 16px;
  color: #536279;
  text-align: left;
  background: #fff;
  cursor: pointer;
}
.case-picker button.selected {
  border-color: #60a5fa;
  box-shadow: 0 10px 24px rgb(37 99 235 / 12%);
  background: #eff6ff;
}
.case-picker small {
  font-size: 0.72rem;
}
.case-picker strong {
  color: #1e293b;
  font-size: 1rem;
}
.case-picker span {
  font-size: 0.78rem;
}
.case-detail {
  padding: 32px;
  border: 1px solid #e5eaf2;
  border-radius: 22px;
  background: #fff;
}
.case-detail header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
}
.case-detail header p {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 700;
}
.case-detail h2 {
  margin: 7px 0 0;
  font-size: 2rem;
  letter-spacing: -0.05em;
}
.case-facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 26px 0;
}
.case-facts div {
  padding: 14px;
  border-radius: 12px;
  background: #f8fafc;
}
.case-facts dt {
  margin-bottom: 7px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}
.case-facts dd {
  margin: 0;
  color: #334155;
  font-size: 0.84rem;
  line-height: 1.45;
}
.case-summary {
  color: #475569;
  line-height: 1.75;
}
.section-title {
  margin-top: 30px;
}
.section-title span {
  color: #2563eb;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.section-title h3 {
  margin: 6px 0 18px;
  font-size: 1.2rem;
}
.event-roadmap {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 18px 0 26px;
}
.event-step {
  position: relative;
  display: grid;
  justify-items: start;
  gap: 8px;
  min-height: 178px;
  padding: 16px 12px;
  border-radius: 14px;
  background: #f8fafc;
}
.event-step__number {
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.event-step__dot {
  width: 14px;
  height: 14px;
  border: 4px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px currentColor;
}
.event-step--law {
  color: #2563eb;
}
.event-step--plan {
  color: #d97706;
}
.event-step--construction {
  color: #059669;
}
.event-step--completion {
  color: #0891b2;
}
.event-step__connector {
  position: absolute;
  z-index: 0;
  top: 56px;
  left: calc(50% + 8px);
  width: calc(100% - 16px);
  height: 2px;
  background: #cbd5e1;
}
.event-step strong,
.event-step small,
.event-step .el-tag {
  position: relative;
  z-index: 1;
}
.event-step strong {
  color: #1e293b;
  font-size: 0.92rem;
  line-height: 1.4;
}
.event-step small {
  color: #64748b;
  font-size: 0.75rem;
}
.return-window {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border: 1px dashed #93c5fd;
  border-radius: 14px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  background: #f8fbff;
}
.return-window i {
  height: 1px;
  background: #93c5fd;
}
.return-window strong {
  color: #1d4ed8;
}
.return-window small {
  grid-column: 1 / -1;
  color: #64748b;
  font-weight: 400;
  line-height: 1.5;
}
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-bottom: 6px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}
.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.chart-legend i {
  width: 18px;
  height: 3px;
  border-radius: 2px;
}
.company-line {
  background: #2563eb;
}
.market-line {
  background: #94a3b8;
}
.chart-legend small {
  color: #94a3b8;
  font-weight: 500;
}
.return-chart {
  display: block;
  width: 100%;
  overflow: visible;
  border-bottom: 1px solid #cbd5e1;
}
.chart-grid {
  stroke: #e2e8f0;
  stroke-width: 1;
}
.chart-label {
  fill: #64748b;
  font-size: 11px;
}
.event-label {
  fill: #1d4ed8;
  font-size: 11px;
  font-weight: 800;
}
.event-line {
  stroke: #93c5fd;
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
}
.company-series {
  stroke: #2563eb;
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.market-series {
  stroke: #94a3b8;
  stroke-width: 2.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.company-point {
  fill: #fff;
  stroke: #2563eb;
  stroke-width: 3;
}
.return-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 18px 0 10px;
}
.return-metrics div {
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
}
.return-metrics dt {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
}
.return-metrics dd {
  margin: 7px 0 0;
  color: #334155;
  font-size: 1rem;
  font-weight: 800;
}
.return-metrics dd.positive {
  color: #047857;
}
.return-metrics dd.negative {
  color: #dc2626;
}
.source-note {
  color: #94a3b8;
  font-size: 0.72rem;
}
.insight-box {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 14px;
  background: #ecfdf5;
}
.insight-box span {
  color: #047857;
  font-size: 0.75rem;
  font-weight: 800;
}
.insight-box strong {
  color: #14532d;
  font-size: 0.95rem;
  line-height: 1.6;
}
.case-detail footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}
.case-detail footer a {
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 700;
}
.method-section {
  margin-top: 44px;
  padding: 32px;
  border-radius: 22px;
  background: #f8fafc;
}
.method-section .eyebrow {
  color: #2563eb;
}
.method-section h2 {
  margin: 0;
  letter-spacing: -0.04em;
}
.method-section ol {
  display: grid;
  gap: 12px;
  margin: 22px 0 0;
  padding-left: 20px;
  color: #475569;
  line-height: 1.6;
}
@media (max-width: 760px) {
  .case-study-page {
    padding: 24px 16px 64px;
  }
  .case-hero {
    padding: 32px 24px;
  }
  .case-layout {
    grid-template-columns: 1fr;
  }
  .case-picker {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow-x: auto;
  }
  .case-picker button {
    min-width: 200px;
  }
  .case-detail {
    padding: 24px;
  }
  .case-facts,
  .event-roadmap {
    grid-template-columns: 1fr;
  }
  .event-step {
    min-height: auto;
  }
  .event-step__connector {
    top: auto;
    bottom: -8px;
    left: 23px;
    width: 2px;
    height: 16px;
  }
  .return-window {
    grid-template-columns: 1fr;
    gap: 7px;
  }
  .return-window i {
    width: 1px;
    height: 14px;
    margin-left: 10px;
  }
  .return-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

