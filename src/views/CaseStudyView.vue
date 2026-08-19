<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EventReactionChart from '@/components/research/EventReactionChart.vue'
import ResearchSignalBoard from '@/components/research/ResearchSignalBoard.vue'
import ResearchChecklist from '@/components/research/ResearchChecklist.vue'
import ResearchJournal from '@/components/research/ResearchJournal.vue'
import { useAnalysisStore } from '@/stores/analysis'
import { CASE_STUDIES } from '@/data/caseStudies'
import { fetchLatestStockPrice } from '@/services/api/stockPriceService'

const route = useRoute()
const router = useRouter()
const analysisStore = useAnalysisStore()

const selectedCategory = computed(() => String(route.query.category ?? '전체'))
const selectedRegion = computed(() => String(route.query.region ?? '전체'))
const selectedCaseId = computed(() => String(route.params.id ?? route.query.case ?? ''))
const activeStudyId = ref(selectedCaseId.value)
const activeDetailTab = ref('market')
const liveQuote = ref(null)
const isDetailPage = computed(() => Boolean(route.params.id))

const filteredStudies = computed(() =>
  CASE_STUDIES.filter((study) => {
    const categoryMatches = selectedCategory.value === '전체' || study.category === selectedCategory.value
    const regionMatches = selectedRegion.value === '전체' || study.region === selectedRegion.value
    return categoryMatches && regionMatches
  }),
)

const appliedFilterLabel = computed(() => {
  const filters = []
  if (selectedCaseId.value) filters.push('선택 사례')
  if (selectedCategory.value !== '전체') filters.push(selectedCategory.value)
  if (selectedRegion.value !== '전체') filters.push(selectedRegion.value)
  return filters.length ? filters.join(' · ') : '전체 사례'
})

const activeStudy = computed(
  () => filteredStudies.value.find((study) => study.id === activeStudyId.value) ?? filteredStudies.value[0],
)
const activeMarket = computed(() =>
  activeStudy.value?.market
    ? { ...activeStudy.value.market, ...(liveQuote.value ? { liveQuote: liveQuote.value } : {}) }
    : null,
)

watch(
  filteredStudies,
  (studies) => {
    if (!studies.some((study) => study.id === activeStudyId.value)) {
      activeStudyId.value = studies[0]?.id ?? ''
    }
  },
  { immediate: true },
)

watch(selectedCaseId, (caseId) => {
  if (caseId && filteredStudies.value.some((study) => study.id === caseId)) {
    activeStudyId.value = caseId
  }
})

watch(activeStudy, (study) => {
  activeDetailTab.value = study?.market ? 'market' : 'policy'
  liveQuote.value = null
  if (study?.market?.stockCode) {
    fetchLatestStockPrice(study.market.stockCode)
      .then((quote) => {
        if (quote.stockCode === study.market.stockCode) liveQuote.value = quote
      })
      .catch(() => {
        liveQuote.value = null
      })
  }
}, { immediate: true })

function selectStudy(study) {
  activeStudyId.value = study.id
  router.push({ name: 'case-study-detail', params: { id: study.id } })
}

function selectDetailTab(tab) {
  activeDetailTab.value = tab
}

function clearFilters() {
  router.push({ name: 'case-studies' })
}

function goToLegislation() {
  router.push({ name: 'legislation' })
}

function getCandidate(study, company) {
  return {
    id: `${study.id}-${company.code}`,
    caseId: study.id,
    caseTitle: study.title,
    companyName: company.name,
    stockCode: company.code,
    relation: company.relation,
    relationType: company.relationType,
    basis: company.basis,
  }
}

function dartSearchUrl(companyName) {
  return `https://dart.fss.or.kr/dsab002/main.do?textCrpNm=${encodeURIComponent(companyName)}`
}

function getMarketObservationCount(study) {
  return study.events.filter((event) => event.market?.return20 != null).length
}
</script>

<template>
  <div class="case-study-page">
    <section class="case-hero">
      <div>
        <p class="eyebrow">LEARN BEFORE YOU DECIDE</p>
        <h1>정책을 보고,<br />내 판단 근거를 쌓습니다.</h1>
        <p>
          정책 원문과 기업 근거, 공시를 차례로 확인하고 내 생각을 기록합니다. 과거 시장 반응은
          정답이 아니라 복기 자료로만 사용합니다.
        </p>
        <div class="hero-actions">
          <el-button v-if="isDetailPage" plain @click="router.push({ name: 'case-studies' })">사례 목록</el-button>
          <el-button type="primary" @click="goToLegislation">최근 법안에서 탐색하기</el-button>
          <el-button v-if="selectedCategory !== '전체' || selectedRegion !== '전체' || selectedCaseId" plain @click="clearFilters">
            필터 초기화
          </el-button>
        </div>
      </div>
      <div class="hero-stat" aria-label="검토 중인 대표 사례 수">
        <span>대표 사례</span>
        <strong>{{ filteredStudies.length }}<small>건</small></strong>
        <small>{{ appliedFilterLabel }}</small>
      </div>
    </section>

    <el-alert class="research-guardrail" type="warning" :closable="false" show-icon>
      <template #title>이 화면은 종목 추천이 아니라, 스스로 판단하기 위한 공부 자료입니다.</template>
      <p>
        사업 참여는 공식 협약·공시·계약 등 공개 근거가 확인된 경우에만 직접 연결로 표시합니다.
        업종·지역이 비슷하다는 이유만으로는 후보로 확정하지 않습니다.
      </p>
    </el-alert>

    <section class="method-grid" aria-label="리서치 판정 기준">
      <article>
        <span class="method-number">01</span>
        <strong>정책 단계</strong>
        <p>발의·의결·고시·협약·승인처럼 날짜가 확인되는 이벤트를 기록합니다.</p>
      </article>
      <article>
        <span class="method-number">02</span>
        <strong>기업 연결 근거</strong>
        <p>입주협약·투자협약·공시 등 직접 근거와 산업 연관을 분리합니다.</p>
      </article>
      <article>
        <span class="method-number">03</span>
        <strong>내 판단 기록</strong>
        <p>확인한 사실과 보류 조건을 적고, 다음에 확인할 공시를 남깁니다.</p>
      </article>
    </section>

    <section class="study-section">
      <div class="section-heading">
        <div>
          <p class="section-eyebrow">FOUNDATION DATASET</p>
          <h2>대표 사례와 연결 근거</h2>
        </div>
        <el-tag type="info" effect="plain">시장 반응은 검증된 사례에만 표시</el-tag>
      </div>

      <el-empty v-if="!filteredStudies.length" description="현재 조건에 맞는 대표 사례가 없습니다.">
        <el-button type="primary" plain @click="clearFilters">전체 사례 보기</el-button>
      </el-empty>

      <div v-else-if="!isDetailPage" class="study-selector" aria-label="케이스 스터디 선택">
        <button
          v-for="study in filteredStudies"
          :key="study.id"
          type="button"
          class="study-selector__item"
          :class="{ 'study-selector__item--active': activeStudy?.id === study.id }"
          @click="selectStudy(study)"
        >
          <span>{{ study.type }}</span>
          <strong>{{ study.title }}</strong>
          <small>{{ study.status }}</small>
        </button>
      </div>

      <article v-for="study in activeStudy ? [activeStudy] : []" :key="study.id" class="study-card">
        <div class="study-card__header">
          <div>
            <div class="study-card__meta">
              <el-tag size="small" effect="plain">{{ study.type }}</el-tag>
              <span>{{ study.region }} · {{ study.category }}</span>
            </div>
            <h3>{{ study.title }}</h3>
            <p>{{ study.summary }}</p>
          </div>
          <div class="study-card__status">
            <el-tag :type="study.statusType" effect="dark">{{ study.status }}</el-tag>
            <small>{{ study.priceStatus }}</small>
          </div>
        </div>

        <div class="research-question">
          <span>검증 질문</span>
          <strong>{{ study.researchQuestion }}</strong>
        </div>

        <section class="evidence-coverage" aria-label="이 사례의 확인 자료 범위">
          <div>
            <small>공식 정책 이벤트</small>
            <strong>{{ study.events.length }}건</strong>
            <span>날짜·원문 확인</span>
          </div>
          <div>
            <small>연결 근거 기업</small>
            <strong>{{ study.companies.length }}곳</strong>
            <span>협약·입지·공개자료</span>
          </div>
          <div>
            <small>시장 반응 관찰</small>
            <strong>{{ getMarketObservationCount(study) }}건</strong>
            <span>사건일 이후 20거래일</span>
          </div>
        </section>

        <nav class="detail-menu" aria-label="케이스 스터디 정보 메뉴">
          <button
            v-if="study.market"
            type="button"
            :class="{ 'detail-menu__item--active': activeDetailTab === 'market' }"
            @click="selectDetailTab('market')"
          >정책 · 주가</button>
          <button type="button" :class="{ 'detail-menu__item--active': activeDetailTab === 'policy' }" @click="selectDetailTab('policy')">정책 타임라인</button>
          <button type="button" :class="{ 'detail-menu__item--active': activeDetailTab === 'company' }" @click="selectDetailTab('company')">기업 근거</button>
          <button type="button" :class="{ 'detail-menu__item--active': activeDetailTab === 'signal' }" @click="selectDetailTab('signal')">검토 신호</button>
          <button type="button" :class="{ 'detail-menu__item--active': activeDetailTab === 'note' }" @click="selectDetailTab('note')">내 노트</button>
        </nav>

        <section v-if="activeDetailTab === 'market' && study.market" class="market-section">
          <div class="detail-tab-heading">
            <div>
              <span>POLICY × MARKET</span>
              <h4>정책 단계와 주가 반응 비교</h4>
            </div>
            <small>사건일 종가 · 이후 5·20거래일 · KOSPI 대비</small>
          </div>
          <EventReactionChart :market="activeMarket" :events="study.events" />
        </section>

        <section v-else-if="activeDetailTab === 'policy'" class="detail-panel">
          <div class="block-title">
            <span>정책·사업 이벤트</span>
            <small>공식 출처 연결</small>
          </div>
          <ol class="event-list">
            <li v-for="event in study.events" :key="`${study.id}-${event.date}-${event.stage}`">
              <time>{{ event.date }}</time>
              <div>
                <el-tag size="small" type="info" effect="plain">{{ event.stage }}</el-tag>
                <a :href="event.sourceUrl" target="_blank" rel="noopener noreferrer">{{ event.title }} ↗</a>
              </div>
            </li>
          </ol>
        </section>

        <section v-else-if="activeDetailTab === 'company'" class="detail-panel">
          <div class="block-title">
            <span>함께 공부할 기업</span>
            <small>근거가 없으면 목록에 넣지 않습니다</small>
          </div>
          <div v-if="study.companies.length" class="company-list">
            <div v-for="company in study.companies" :key="company.code" class="company-row">
              <div>
                <strong>{{ company.name }}</strong>
                <small>종목코드 {{ company.code }}</small>
              </div>
              <div class="company-actions">
                <el-tag :type="company.relationType" effect="plain">{{ company.relation }}</el-tag>
                <a v-if="company.sourceUrl" :href="company.sourceUrl" target="_blank" rel="noopener noreferrer" class="company-source">근거 ↗</a>
                <a :href="dartSearchUrl(company.name)" target="_blank" rel="noopener noreferrer" class="company-disclosure">공시 ↗</a>
                <el-button size="small" plain @click="analysisStore.toggleResearchCandidate(getCandidate(study, company))">
                  {{ analysisStore.isResearchCandidateSaved(getCandidate(study, company).id) ? '공부 목록에서 빼기' : '공부 목록 담기' }}
                </el-button>
              </div>
              <p>{{ company.basis }}</p>
            </div>
          </div>
          <el-empty v-else :image-size="56" description="직접 참여가 확인된 상장기업이 없어 목록을 만들지 않습니다." />
        </section>

        <section v-else-if="activeDetailTab === 'signal'" class="detail-panel">
          <ResearchSignalBoard :signals="study.signals" />
          <ResearchChecklist :case-id="study.id" :has-direct-company="study.companies.length > 0" />
          <el-alert v-if="!study.market" type="info" :closable="false" show-icon>
            <template #title>직접 참여가 확인된 상장기업이 없어 주가 차트를 제공하지 않습니다.</template>
            <p>법안·사업의 존재만으로 관련 종목을 만들지 않는 대조 사례입니다.</p>
          </el-alert>
        </section>

        <section v-else class="detail-panel">
          <ResearchJournal :case-id="study.id" />
        </section>

      </article>
    </section>
  </div>
</template>

<style scoped>
.case-study-page { max-width: 1240px; margin: 0 auto; padding: 56px 24px 88px; }
.case-hero { display: flex; justify-content: space-between; gap: 32px; padding: 46px 48px; border-radius: 28px; color: #fff; background: radial-gradient(circle at 88% 12%, rgb(45 212 191 / 22%), transparent 28%), linear-gradient(135deg, #172554, #1e3a8a 58%, #0f766e); box-shadow: 0 24px 50px rgb(30 58 138 / 18%); }
.case-hero > div:first-child { max-width: 760px; }
.eyebrow, .section-eyebrow { margin: 0 0 10px; font-size: .72rem; font-weight: 800; letter-spacing: .16em; }
.eyebrow { color: #99f6e4; }
.case-hero h1 { margin: 0; color: #fff; font-size: clamp(2.25rem, 5vw, 3.8rem); letter-spacing: -.07em; line-height: 1.1; }
.case-hero p { margin: 20px 0 0; color: #dbeafe; line-height: 1.75; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
.hero-stat { display: grid; align-content: end; min-width: 174px; gap: 5px; padding: 22px; border: 1px solid rgb(255 255 255 / 20%); border-radius: 18px; background: rgb(15 23 42 / 20%); }
.hero-stat span, .hero-stat small { color: #cbd5e1; font-size: .78rem; }
.hero-stat strong { font-size: 3rem; letter-spacing: -.08em; line-height: 1; }.hero-stat strong small { margin-left: 4px; font-size: 1rem; }
.research-guardrail { margin-top: 24px; }.research-guardrail p { margin: 6px 0 0; line-height: 1.6; }
.method-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 24px 0 48px; }.method-grid article { padding: 22px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; }.method-number { display: block; margin-bottom: 16px; color: #2563eb; font-size: .72rem; font-weight: 800; letter-spacing: .12em; }.method-grid strong { color: #172033; }.method-grid p { margin: 8px 0 0; color: #64748b; font-size: .86rem; line-height: 1.6; }
.evidence-coverage { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 0 0 20px; }.evidence-coverage > div { display: grid; gap: 4px; padding: 14px; border: 1px solid #dbe7f3; border-radius: 12px; background: #f8fbff; }.evidence-coverage small { color: #64748b; font-size: .7rem; font-weight: 800; }.evidence-coverage strong { color: #1e3a5f; font-size: 1.25rem; letter-spacing: -.05em; }.evidence-coverage span { color: #94a3b8; font-size: .68rem; line-height: 1.4; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 20px; }.section-eyebrow { color: #2563eb; }.section-heading h2 { margin: 0; color: #172033; font-size: 1.55rem; letter-spacing: -.05em; }
.study-section { display: grid; gap: 20px; }.study-selector { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }.study-selector__item { display: grid; gap: 7px; min-height: 118px; padding: 18px; border: 1px solid #dce5f0; border-radius: 16px; color: #64748b; background: #fff; text-align: left; cursor: pointer; }.study-selector__item:hover { border-color: #93c5fd; }.study-selector__item--active { border-color: #2563eb; background: #eff6ff; box-shadow: 0 8px 18px rgb(37 99 235 / 10%); }.study-selector__item span { color: #64748b; font-size: .68rem; font-weight: 800; }.study-selector__item strong { color: #1e293b; font-size: .92rem; line-height: 1.35; }.study-selector__item small { color: #0f766e; font-size: .7rem; font-weight: 800; }.study-card { padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; background: #fff; box-shadow: 0 8px 18px rgb(15 23 42 / 3%); }.study-card__header { display: flex; justify-content: space-between; gap: 24px; }.study-card__meta { display: flex; align-items: center; gap: 10px; color: #64748b; font-size: .8rem; }.study-card h3 { margin: 14px 0 8px; color: #172033; font-size: 1.36rem; letter-spacing: -.045em; }.study-card__header p { max-width: 800px; margin: 0; color: #64748b; font-size: .9rem; line-height: 1.65; }.study-card__status { display: grid; align-content: start; justify-items: end; gap: 9px; min-width: 145px; }.study-card__status small { color: #94a3b8; font-size: .75rem; }.research-question { display: grid; gap: 5px; margin: 24px 0; padding: 15px 18px; border-radius: 12px; background: #f0fdfb; }.research-question span { color: #0f766e; font-size: .72rem; font-weight: 800; }.research-question strong { color: #1f3a37; font-size: .9rem; line-height: 1.6; }.detail-menu { display: flex; gap: 4px; overflow-x: auto; margin: 24px 0 18px; padding: 5px; border: 1px solid #dce8f5; border-radius: 14px; background: #f8fbff; }.detail-menu button { flex: 0 0 auto; padding: 10px 14px; border: 0; border-radius: 9px; color: #64748b; background: transparent; font-size: .78rem; font-weight: 800; cursor: pointer; }.detail-menu button:hover { color: #1d4ed8; }.detail-menu .detail-menu__item--active { color: #fff; background: #1d4ed8; box-shadow: 0 4px 10px rgb(29 78 216 / 18%); }.detail-panel, .market-section { min-height: 310px; padding: 22px; border: 1px solid #dce8f5; border-radius: 16px; background: #fff; }.detail-tab-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin: 0 0 16px; }.detail-tab-heading div { display: grid; gap: 4px; }.detail-tab-heading span { color: #2563eb; font-size: .68rem; font-weight: 900; letter-spacing: .12em; }.detail-tab-heading h4 { margin: 0; color: #172554; font-size: 1.05rem; letter-spacing: -.04em; }.detail-tab-heading > small { color: #94a3b8; font-size: .72rem; }.block-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }.block-title span { color: #334155; font-size: .86rem; font-weight: 800; }.block-title small { color: #94a3b8; font-size: .72rem; }.event-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }.event-list li { display: grid; grid-template-columns: 86px 1fr; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid #eef2f7; }.event-list time { color: #64748b; font-size: .78rem; font-weight: 700; }.event-list li > div { display: grid; justify-items: start; gap: 7px; }.event-list a { color: #334155; font-size: .84rem; font-weight: 700; line-height: 1.45; }.company-list { display: grid; gap: 10px; }.company-row { display: grid; grid-template-columns: 1fr auto; gap: 5px 12px; padding: 13px; border-radius: 12px; background: #f8fafc; }.company-row > div { display: grid; gap: 2px; }.company-row strong { color: #1e293b; font-size: .88rem; }.company-row small { color: #94a3b8; font-size: .72rem; }.company-row p { grid-column: 1 / -1; margin: 4px 0 0; color: #64748b; font-size: .78rem; line-height: 1.55; }.company-actions { display: flex !important; align-items: center; justify-content: end; gap: 8px; }
.company-source, .company-disclosure { color: #2563eb; font-size: .72rem; font-weight: 800; white-space: nowrap; }.company-disclosure { color: #7c3aed; }
@media (max-width: 760px) { .case-study-page { padding: 28px 18px 60px; }.case-hero, .study-card__header { display: grid; padding: 30px 24px; }.hero-stat, .study-card__status { justify-items: start; }.method-grid, .study-selector { grid-template-columns: 1fr; }.section-heading, .detail-tab-heading { align-items: start; display: grid; }.study-card { padding: 22px; }.detail-panel, .market-section { padding: 16px; } }
@media (max-width: 520px) { .evidence-coverage { grid-template-columns: 1fr; } }
</style>
