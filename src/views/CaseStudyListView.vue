<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CASE_STUDIES } from '@/data/caseStudies'

const route = useRoute()
const router = useRouter()
const selectedCategory = ref(String(route.query.category ?? '전체'))
const selectedRegion = ref(String(route.query.region ?? '전체'))
const evidenceFilter = ref('전체')
const selectedStage = ref('전체')
const visibleCount = ref(6)

const categoryOptions = computed(() => ['전체', ...new Set(CASE_STUDIES.map((study) => study.category))])
const regionOptions = computed(() => ['전체', ...new Set(CASE_STUDIES.map((study) => study.region))])

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function normalizePolicyStage(stage) {
  if (['정책 발표', '후보지 발표'].includes(stage)) return '발표·후보지'
  if (['특화단지 지정', '산단 승인', '국회 의결', '법 시행', '기본계획'].includes(stage)) return '지정·승인'
  if (['투자협약', '기본·입주협약', '업무협약', '산단 투자 발표'].includes(stage)) return '협약·투자'
  return '기타 정책 단계'
}

const marketObservationSummary = computed(() => {
  const excessReturns = CASE_STUDIES.flatMap((study) =>
    study.events
      .filter((event) => event.market?.return20 != null && event.market?.marketReturn20 != null)
      .map((event) => event.market.return20 - event.market.marketReturn20),
  )
  const positiveCount = excessReturns.filter((value) => value > 0).length

  return {
    count: excessReturns.length,
    median20: excessReturns.length ? median(excessReturns) : 0,
    positiveRatio: excessReturns.length ? (positiveCount / excessReturns.length) * 100 : 0,
  }
})

const stageObservationSummary = computed(() => {
  const groups = new Map()
  CASE_STUDIES.forEach((study) => study.events.forEach((event) => {
    if (event.market?.return20 == null || event.market?.marketReturn20 == null) return
    const stage = normalizePolicyStage(event.stage)
    const values = groups.get(stage) ?? []
    values.push(event.market.return20 - event.market.marketReturn20)
    groups.set(stage, values)
  }))

  const stageOrder = ['발표·후보지', '협약·투자', '지정·승인']
  return stageOrder
    .map((stage) => {
      const values = groups.get(stage) ?? []
      const positiveCount = values.filter((value) => value > 0).length
      return {
        stage,
        count: values.length,
        median20: values.length ? median(values) : 0,
        positiveRatio: values.length ? (positiveCount / values.length) * 100 : 0,
      }
    })
    .filter((item) => item.count)
})

const policyFilteredStudies = computed(() =>
  CASE_STUDIES.filter((study) =>
    (selectedCategory.value === '전체' || study.category === selectedCategory.value)
    && (selectedRegion.value === '전체' || study.region === selectedRegion.value)
    && (selectedStage.value === '전체' || study.events.some((event) => normalizePolicyStage(event.stage) === selectedStage.value)),
  ),
)

const filteredStudies = computed(() => policyFilteredStudies.value.filter((study) => {
  if (evidenceFilter.value === '시장 반응 관찰') return Boolean(study.market)
  if (evidenceFilter.value === '기업 연결 검토') return !study.market && study.companies.length > 0
  if (evidenceFilter.value === '정책 단계 확인') return study.companies.length === 0
  return true
}))

const evidenceCounts = computed(() => ({
  all: policyFilteredStudies.value.length,
  market: policyFilteredStudies.value.filter((study) => study.market).length,
  company: policyFilteredStudies.value.filter((study) => !study.market && study.companies.length > 0).length,
  policyOnly: policyFilteredStudies.value.filter((study) => study.companies.length === 0).length,
}))

const visibleStudies = computed(() => filteredStudies.value.slice(0, visibleCount.value))
const hasMoreStudies = computed(() => visibleStudies.value.length < filteredStudies.value.length)

watch([selectedCategory, selectedRegion, evidenceFilter, selectedStage], () => {
  visibleCount.value = 6
})

function selectStage(stage) {
  selectedStage.value = selectedStage.value === stage ? '전체' : stage
}

function openStudy(study) {
  router.push({ name: 'case-study-detail', params: { id: study.id } })
}
</script>

<template>
  <main class="case-list-page">
    <section class="hero">
      <p>LEARN BEFORE YOU DECIDE</p>
      <h1>뉴스를 따라가기보다,<br />내 판단 근거를 쌓습니다.</h1>
      <span>정책 원문 · 기업 근거 · 공시 · 내 판단 노트를 차례로 확인하세요.</span>
    </section>

    <el-alert class="market-result-alert" type="warning" :closable="false" show-icon>
      <template #title>현재 표본에서는 ‘정책 발표 뒤 주가 상승’ 공식이 보이지 않습니다.</template>
      <p>
        시장 반응 {{ marketObservationSummary.count }}건 · 20거래일 시장 대비 중앙값
        {{ marketObservationSummary.median20 >= 0 ? '+' : '' }}{{ marketObservationSummary.median20.toFixed(2) }}% · 양의 반응
        {{ marketObservationSummary.positiveRatio.toFixed(1) }}%
      </p>
    </el-alert>

    <section class="stage-observation-section" aria-label="정책 단계별 시장 관찰 요약">
      <div>
        <span>정책 단계별 관찰</span>
        <small>표본이 작아 예측 공식으로 사용할 수 없습니다.</small>
      </div>
      <div class="stage-observation-grid">
        <button
          v-for="item in stageObservationSummary"
          :key="item.stage"
          type="button"
          :class="{ 'is-selected': selectedStage === item.stage }"
          :aria-pressed="selectedStage === item.stage"
          @click="selectStage(item.stage)"
        >
          <span>{{ item.stage }}</span>
          <strong :class="{ 'is-negative': item.median20 < 0 }">
            {{ item.median20 >= 0 ? '+' : '' }}{{ item.median20.toFixed(2) }}%
          </strong>
          <small>20일 시장 대비 중앙값 · {{ item.count }}건</small>
        </button>
      </div>
    </section>

    <section class="list-heading">
      <div>
        <p>CASE STUDIES</p>
        <h2>{{ selectedStage === '전체' ? '사례' : `${selectedStage} 사례` }} {{ evidenceCounts.all }}건</h2>
      </div>
      <small>카드를 눌러 원문과 내 판단 노트를 확인하세요.</small>
    </section>

    <div class="evidence-filter" aria-label="사례 자료 수준 필터">
      <el-button :type="evidenceFilter === '전체' ? 'primary' : 'default'" round @click="evidenceFilter = '전체'">
        전체 {{ evidenceCounts.all }}
      </el-button>
      <el-button :type="evidenceFilter === '시장 반응 관찰' ? 'primary' : 'default'" round @click="evidenceFilter = '시장 반응 관찰'">
        시장 반응 관찰 {{ evidenceCounts.market }}
      </el-button>
      <el-button :type="evidenceFilter === '기업 연결 검토' ? 'primary' : 'default'" round @click="evidenceFilter = '기업 연결 검토'">
        기업 연결 검토 {{ evidenceCounts.company }}
      </el-button>
      <el-button :type="evidenceFilter === '정책 단계 확인' ? 'primary' : 'default'" round @click="evidenceFilter = '정책 단계 확인'">
        정책 단계 확인 {{ evidenceCounts.policyOnly }}
      </el-button>
    </div>

    <div class="case-filter-row" aria-label="산업과 지역으로 사례 좁히기">
      <el-select v-model="selectedCategory" aria-label="산업 선택" placeholder="산업 전체">
        <el-option v-for="category in categoryOptions" :key="category" :label="`${category === '전체' ? '전체 산업' : category}`" :value="category" />
      </el-select>
      <el-select v-model="selectedRegion" aria-label="지역 선택" placeholder="지역 전체">
        <el-option v-for="region in regionOptions" :key="region" :label="`${region === '전체' ? '전체 지역' : region}`" :value="region" />
      </el-select>
      <el-button v-if="selectedCategory !== '전체' || selectedRegion !== '전체' || selectedStage !== '전체'" plain @click="selectedCategory = '전체'; selectedRegion = '전체'; selectedStage = '전체'">초기화</el-button>
    </div>

    <el-empty v-if="!filteredStudies.length" description="이 조건에 맞는 사례가 없습니다." />
    <div v-else class="study-grid">
      <button v-for="study in visibleStudies" :key="study.id" type="button" class="study-card" @click="openStudy(study)">
        <div class="study-card__top">
          <el-tag size="small" effect="plain">{{ study.type }}</el-tag>
          <el-tag size="small" :type="study.statusType" effect="light">{{ study.status }}</el-tag>
        </div>
        <h3>{{ study.title }}</h3>
        <p>{{ study.summary }}</p>
        <footer>
          <span>{{ study.region }} · {{ study.category }}</span>
          <strong>상세 보기 →</strong>
        </footer>
      </button>
    </div>
    <div v-if="hasMoreStudies" class="more-studies">
      <small>현재 {{ visibleStudies.length }}개 표시 · 전체 {{ filteredStudies.length }}개</small>
      <el-button plain type="primary" @click="visibleCount += 6">사례 더 보기</el-button>
    </div>
  </main>
</template>

<style scoped>
.case-list-page { max-width: 1160px; margin: 0 auto; padding: 56px 24px 88px; }
.hero { padding: 46px 48px; border-radius: 28px; color: #fff; background: radial-gradient(circle at 88% 8%, rgb(45 212 191 / 25%), transparent 26%), linear-gradient(135deg, #172554, #1e3a8a 60%, #0f766e); }
.hero p, .list-heading p { margin: 0 0 9px; font-size: .72rem; font-weight: 800; letter-spacing: .16em; }.hero p { color: #99f6e4; }.hero h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.7rem); line-height: 1.14; letter-spacing: -.07em; }.hero span { display: block; margin-top: 20px; color: #dbeafe; line-height: 1.65; }
.case-list-page > .el-alert { margin-top: 20px; }.market-result-alert p { margin: 7px 0 0; color: #7c4a03; font-size: .82rem; font-weight: 800; line-height: 1.55; }.list-heading { display: flex; justify-content: space-between; align-items: end; gap: 18px; margin: 46px 0 18px; }.list-heading p { color: #2563eb; }.list-heading h2 { margin: 0; color: #172033; font-size: 1.65rem; letter-spacing: -.05em; }.list-heading small { color: #64748b; }
.stage-observation-section { display: grid; gap: 13px; margin-top: 18px; padding: 18px; border: 1px solid #dbe7f3; border-radius: 16px; background: #fff; }.stage-observation-section > div:first-child { display: flex; align-items: center; justify-content: space-between; gap: 16px; }.stage-observation-section > div:first-child span { color: #334155; font-size: .84rem; font-weight: 800; }.stage-observation-section > div:first-child small { color: #94a3b8; font-size: .72rem; }.stage-observation-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.stage-observation-grid button { display: grid; gap: 4px; padding: 12px; border: 1px solid transparent; border-radius: 11px; background: #f8fafc; text-align: left; cursor: pointer; transition: border-color .16s ease, background .16s ease; }.stage-observation-grid button:hover, .stage-observation-grid button.is-selected { border-color: #60a5fa; background: #eff6ff; }.stage-observation-grid button > span { color: #64748b; font-size: .72rem; font-weight: 800; }.stage-observation-grid strong { color: #047857; font-size: 1.12rem; letter-spacing: -.05em; }.stage-observation-grid strong.is-negative { color: #dc2626; }.stage-observation-grid small { color: #94a3b8; font-size: .66rem; line-height: 1.4; }
.evidence-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.case-filter-row { display: flex; flex-wrap: wrap; gap: 8px; margin: -8px 0 18px; }.case-filter-row .el-select { width: min(210px, 100%); }
.study-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }.study-card { display: grid; min-width: 0; min-height: 264px; padding: 22px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 18px; color: inherit; background: #fff; text-align: left; cursor: pointer; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }.study-card:hover { border-color: #60a5fa; box-shadow: 0 14px 25px rgb(30 64 175 / 12%); transform: translateY(-3px); }.study-card__top { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; align-items: start; min-width: 0; }.study-card h3 { display: -webkit-box; overflow: hidden; margin: 23px 0 8px; color: #172033; font-size: 1.1rem; letter-spacing: -.04em; line-height: 1.35; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.study-card p { display: -webkit-box; overflow: hidden; margin: 0; color: #64748b; font-size: .86rem; line-height: 1.65; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }.study-card footer { display: flex; min-width: 0; justify-content: space-between; align-items: center; align-self: end; gap: 10px; margin-top: 18px; padding-top: 14px; border-top: 1px solid #eef2f7; color: #64748b; font-size: .73rem; }.study-card footer span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.study-card footer strong { flex: 0 0 auto; color: #2563eb; font-size: .78rem; }
.more-studies { display: grid; justify-items: center; gap: 10px; margin-top: 26px; }.more-studies small { color: #64748b; font-size: .78rem; }
@media (max-width: 760px) { .case-list-page { padding: 28px 18px 60px; }.hero { padding: 31px 24px; }.study-grid, .stage-observation-grid { grid-template-columns: 1fr; }.list-heading { align-items: start; display: grid; }.stage-observation-section > div:first-child { align-items: flex-start; display: grid; } }
</style>
