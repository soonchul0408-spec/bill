<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ApiFallbackNotice from '@/components/regional/ApiFallbackNotice.vue'
import DataOriginBadge from '@/components/regional/DataOriginBadge.vue'
import NationalKoreaMap from '@/components/nationalMap/NationalKoreaMap.vue'
import NationalMapFilters from '@/components/nationalMap/NationalMapFilters.vue'
import RegionalInsightPanel from '@/components/nationalMap/RegionalInsightPanel.vue'
import { getNationalRegionId } from '@/data/nationalMapData'
import { useNationalMapStore } from '@/stores/nationalMap'

const router = useRouter()
const mapStore = useNationalMapStore()
const activeView = ref('map')

const topRegions = computed(() =>
  [...mapStore.mapRegions]
    .sort((left, right) => right.projectCount - left.projectCount)
    .slice(0, 5),
)

const regionalScores = computed(() => {
  const advancedStages = new Set(['사업자 선정', '착공', '집행'])

  return mapStore.mapRegions
    .map((region) => {
      const projects = mapStore.filteredProjects.filter(
        (project) => getNationalRegionId(project.region) === region.id,
      )
      const bills = mapStore.filteredBills.filter(
        (bill) => getNationalRegionId(bill.region) === region.id,
      )
      const fiscalRecords = projects.filter((project) => project.recordType === '재정 집행')
      const projectRecords = projects.filter((project) => project.recordType !== '재정 집행')
      const budgetAmount = fiscalRecords.reduce((total, record) => total + (Number(record.budgetAmount) || 0), 0)
      const expenditureAmount = fiscalRecords.reduce(
        (total, record) => total + (Number(record.expenditureAmount) || 0),
        0,
      )
      const fiscalRate = budgetAmount > 0 ? Math.min(100, Math.round((expenditureAmount / budgetAmount) * 100)) : null
      const stageScore = Math.min(
        100,
        projectRecords.filter((project) => advancedStages.has(project.stage)).length * 35,
      )
      const execution = fiscalRate === null ? stageScore : Math.round(stageScore * 0.45 + fiscalRate * 0.55)
      const policy = Math.min(100, projectRecords.length * 18 + bills.length * 12)
      const evidence = Math.min(
        100,
        projectRecords.filter((project) => (project.relatedCompanyIds ?? []).length > 0).length * 35,
      )
      const allRecords = [...projects, ...bills]
      const confirmedRecords = allRecords.filter((record) => ['live', 'mixed'].includes(record.dataOrigin)).length
      const confidence = allRecords.length ? Math.round((confirmedRecords / allRecords.length) * 100) : 0
      const total = Math.round(policy * 0.35 + execution * 0.3 + evidence * 0.2 + confidence * 0.15)

      return {
        ...region,
        total,
        policy,
        execution,
        evidence,
        confidence,
        fiscalRate,
        projectCount: projectRecords.length,
        billCount: bills.length,
      }
    })
    .filter((region) => region.total || region.projectCount || region.billCount)
    .sort((left, right) => right.total - left.total || right.confidence - left.confidence)
})

function openRegion(regionId) {
  mapStore.selectRegion(regionId)
  router.push({ name: 'national-region-detail', params: { regionId } })
}

function handleRegionChange(regionId) {
  if (regionId === '전체') return
  openRegion(regionId)
}

function selectView(view) {
  activeView.value = view
}

onMounted(() => {
  void mapStore.load()
})
</script>

<template>
  <div class="national-page">
    <section class="national-hero">
      <div class="hero-copy">
        <p class="eyebrow">NATIONAL REGIONAL INTELLIGENCE</p>
        <h1>전국 지도</h1>
        <p class="hero-description">
          대한민국 시·도별 정책·예산·법안·사업과 공개자료 기반 관련 기업을 한 화면에서 비교해 보세요.
        </p>
        <div class="hero-note">
          <DataOriginBadge :origin="mapStore.dataOrigin" />
          <span>지역별 공개자료 건수와 현재 선택한 필터를 함께 시각화합니다.</span>
        </div>
      </div>

      <el-card class="hero-summary" shadow="never">
        <span>현재 조건의 전국 정보</span>
        <strong>{{ mapStore.summary.projectCount + mapStore.summary.billCount }}<small>건</small></strong>
        <small>사업 {{ mapStore.summary.projectCount }} · 법안 {{ mapStore.summary.billCount }}</small>
      </el-card>
    </section>

    <NationalMapFilters @region-change="handleRegionChange" />

    <ApiFallbackNotice
      :status="mapStore.noticeStatus"
      :message="mapStore.noticeMessage"
      @retry="mapStore.retry"
    />

    <div v-if="mapStore.isLoading" class="loading-layout" aria-busy="true">
      <el-card shadow="never"><el-skeleton animated :rows="12" /></el-card>
      <el-card shadow="never"><el-skeleton animated :rows="8" /></el-card>
    </div>

    <template v-else>
      <nav class="national-view-menu" aria-label="전국 지도 화면 메뉴">
        <button type="button" :class="{ 'national-view-menu__item--active': activeView === 'map' }" @click="selectView('map')">
          지도 보기
        </button>
        <button type="button" :class="{ 'national-view-menu__item--active': activeView === 'ranking' }" @click="selectView('ranking')">
          지역 순위 <strong>상위 5</strong>
        </button>
        <button type="button" :class="{ 'national-view-menu__item--active': activeView === 'briefing' }" @click="selectView('briefing')">
          통합 분석
        </button>
        <button type="button" :class="{ 'national-view-menu__item--active': activeView === 'comparison' }" @click="selectView('comparison')">
          비교 기준
        </button>
      </nav>

      <section v-if="activeView === 'map'" class="map-layout map-layout--single">
        <el-card class="map-card" shadow="never">
          <NationalKoreaMap
            :regions="mapStore.mapRegions"
            :selected-region-id="mapStore.selectedRegionId"
            @select="openRegion"
          />
        </el-card>
      </section>

      <section v-else-if="activeView === 'ranking'" class="ranking-layout">
        <el-card class="rank-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <p class="section-eyebrow">REGION RANKING</p>
                <h2>사업 공개자료가 많은 지역</h2>
              </div>
              <el-tag type="info" effect="plain">상위 5</el-tag>
            </div>
          </template>

          <div class="rank-list">
            <button
              v-for="(region, index) in topRegions"
              :key="region.id"
              type="button"
              class="rank-row"
              @click="openRegion(region.id)"
            >
              <span class="rank-number">{{ index + 1 }}</span>
              <span class="rank-name">{{ region.label }}</span>
              <span class="rank-count">{{ region.projectCount }}건</span>
            </button>
          </div>
          <el-empty
            v-if="!topRegions.some((region) => region.projectCount)"
            :image-size="70"
            description="현재 조건에 맞는 사업 공개자료가 없습니다."
          />
          <p class="rank-help">지도 또는 지역명을 선택하면 지역별 통합 화면으로 이동합니다.</p>
        </el-card>
      </section>

      <section v-else-if="activeView === 'comparison'" class="comparison-layout">
        <el-alert
          title="지역 비교는 투자 추천 점수가 아닙니다."
          type="info"
          :closable="false"
          show-icon
          description="공개자료의 정책·실행·기업 근거·데이터 신뢰도를 같은 기준으로 정리한 탐색용 지표입니다."
        />

        <el-card class="comparison-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <p class="section-eyebrow">COMPARISON METHOD</p>
                <h2>지역·산업 비교 기준</h2>
              </div>
              <el-tag type="warning" effect="plain">필터 적용 결과</el-tag>
            </div>
          </template>

          <div class="method-list">
            <div><strong>정책 모멘텀 35%</strong><span>사업·법안 공개 건수</span></div>
            <div><strong>실행 공개도 30%</strong><span>사업 단계와 예산 대비 지출액</span></div>
            <div><strong>기업 근거 20%</strong><span>사업에 연결된 관련 기업 근거</span></div>
            <div><strong>데이터 신뢰도 15%</strong><span>실시간·검증 자료 비중</span></div>
          </div>
          <p class="comparison-note">시장 반응은 정책과 종목이 직접 연결된 사례에서만 별도로 보여주며, 지역 점수에는 포함하지 않습니다.</p>

          <div class="comparison-list">
            <button
              v-for="(region, index) in regionalScores"
              :key="region.id"
              type="button"
              class="comparison-row"
              @click="openRegion(region.id)"
            >
              <span class="comparison-rank">{{ index + 1 }}</span>
              <span class="comparison-name">
                <strong>{{ region.label }}</strong>
                <small>사업 {{ region.projectCount }} · 법안 {{ region.billCount }}{{ region.fiscalRate === null ? '' : ` · 집행률 ${region.fiscalRate}%` }}</small>
              </span>
              <span class="comparison-bars" aria-hidden="true">
                <i class="comparison-bar comparison-bar--policy" :style="{ width: `${region.policy}%` }"></i>
                <i class="comparison-bar comparison-bar--execution" :style="{ width: `${region.execution}%` }"></i>
                <i class="comparison-bar comparison-bar--evidence" :style="{ width: `${region.evidence}%` }"></i>
                <i class="comparison-bar comparison-bar--confidence" :style="{ width: `${region.confidence}%` }"></i>
              </span>
              <span class="comparison-score">{{ region.total }}<small>/100</small></span>
            </button>
          </div>
          <el-empty v-if="!regionalScores.length" :image-size="70" description="현재 필터에 맞는 비교 대상이 없습니다." />
        </el-card>
      </section>

      <RegionalInsightPanel v-else />
    </template>
  </div>
</template>

<style scoped>
.national-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 56px 24px 88px;
}

.national-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 48px;
  border-radius: 28px;
  color: #fff;
  background:
    radial-gradient(circle at 87% 8%, rgb(45 212 191 / 27%), transparent 34%),
    linear-gradient(135deg, #172554 0%, #1e3a8a 58%, #0f766e 130%);
  box-shadow: 0 24px 50px rgb(30 58 138 / 18%);
}

.hero-copy {
  max-width: 720px;
}

.eyebrow,
.section-eyebrow {
  margin: 0 0 10px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.eyebrow,
.national-page .section-eyebrow {
  color: #93c5fd;
}

.national-hero h1 {
  margin: 0;
  font-size: clamp(2.3rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 1.1;
}

.hero-description {
  max-width: 660px;
  margin: 20px 0 0;
  color: #dbeafe;
  font-size: 1.04rem;
  line-height: 1.75;
}

.hero-note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  color: #bfdbfe;
  font-size: 0.82rem;
}

.hero-summary {
  display: grid;
  flex: 0 0 230px;
  gap: 8px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 18px;
  color: #dbeafe;
  background: rgb(15 23 42 / 24%);
}

:deep(.hero-summary .el-card__body) {
  display: grid;
  gap: 8px;
  padding: 22px;
}

.hero-summary > span,
.hero-summary > small {
  color: #bfdbfe;
  font-size: 0.76rem;
}

.hero-summary strong {
  color: #fff;
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.08em;
  line-height: 1;
}

.hero-summary strong small {
  margin-left: 4px;
  color: #bfdbfe;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
}

.national-page > :deep(.map-filter-card) {
  margin-top: 28px;
}

.national-view-menu { display: flex; gap: 6px; margin-top: 24px; padding: 6px; border: 1px solid #dbe7f3; border-radius: 16px; background: #f8fbff; }.national-view-menu button { display: flex; flex: 1; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: 0; border-radius: 11px; color: #64748b; background: transparent; font-size: .82rem; font-weight: 800; cursor: pointer; }.national-view-menu button strong { color: inherit; font-size: .7rem; }.national-view-menu button:hover { color: #1d4ed8; }.national-view-menu .national-view-menu__item--active { color: #fff; background: #1d4ed8; box-shadow: 0 5px 12px rgb(29 78 216 / 18%); }

.map-layout,
.loading-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(290px, 0.75fr);
  gap: 22px;
  margin-top: 24px;
}

.map-layout--single { grid-template-columns: minmax(0, 1fr); }

.ranking-layout { display: grid; max-width: 560px; margin: 24px auto 0; }

.map-card,
.rank-card,
.loading-layout .el-card {
  border: 1px solid #e5eaf2;
  border-radius: 20px;
  background: #fff;
}

.rank-card {
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rank-card .section-eyebrow {
  margin-bottom: 7px;
  color: #2563eb;
}

.card-header h2 {
  margin: 0;
  color: #172033;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.rank-list {
  display: grid;
  gap: 8px;
}

.rank-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 13px 12px;
  border: 1px solid #edf0f5;
  border-radius: 12px;
  color: #34445e;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.rank-row:hover,
.rank-row:focus-visible {
  border-color: #93c5fd;
  background: #f8fbff;
  outline: none;
}

.rank-number {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  color: #2563eb;
  background: #eff6ff;
  font-size: 0.72rem;
  font-weight: 800;
}

.rank-name {
  overflow: hidden;
  font-size: 0.84rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-count {
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
}

.rank-help {
  margin: 16px 0 0;
  color: #96a0b1;
  font-size: 0.74rem;
  line-height: 1.5;
}

.comparison-layout {
  display: grid;
  gap: 16px;
  max-width: 860px;
  margin: 24px auto 0;
}

.comparison-card {
  border: 1px solid #e5eaf2;
  border-radius: 20px;
}

.method-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.method-list div {
  display: grid;
  gap: 5px;
  padding: 13px;
  border-radius: 12px;
  background: #f8fbff;
}

.method-list strong {
  color: #1e3a8a;
  font-size: 0.75rem;
}

.method-list span,
.comparison-note {
  color: #64748b;
  font-size: 0.72rem;
  line-height: 1.5;
}

.comparison-note {
  margin: 14px 0 0;
}

.comparison-list {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.comparison-row {
  display: grid;
  grid-template-columns: 28px minmax(125px, .9fr) minmax(150px, 1.35fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid #edf0f5;
  border-radius: 12px;
  color: #334155;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.comparison-row:hover,
.comparison-row:focus-visible {
  border-color: #93c5fd;
  background: #f8fbff;
  outline: none;
}

.comparison-rank {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  color: #1d4ed8;
  background: #eff6ff;
  font-size: .72rem;
  font-weight: 800;
}

.comparison-name {
  display: grid;
  gap: 4px;
}

.comparison-name strong { font-size: .84rem; }
.comparison-name small { color: #64748b; font-size: .7rem; }

.comparison-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  align-items: end;
  height: 26px;
}

.comparison-bar {
  display: block;
  min-width: 4px;
  height: 5px;
  border-radius: 999px;
  transform-origin: left;
}

.comparison-bar--policy { background: #2563eb; }
.comparison-bar--execution { background: #0f766e; }
.comparison-bar--evidence { background: #9333ea; }
.comparison-bar--confidence { background: #d97706; }

.comparison-score {
  color: #172554;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: -.05em;
}

.comparison-score small {
  margin-left: 2px;
  color: #94a3b8;
  font-size: .65rem;
  letter-spacing: 0;
}

@media (max-width: 900px) {
  .map-layout,
  .loading-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .national-page {
    padding: 32px 18px 64px;
  }

  .national-hero {
    align-items: stretch;
    display: grid;
    padding: 32px 24px;
  }

  .hero-summary {
    width: 100%;
  }

  .national-view-menu { overflow-x: auto; }.national-view-menu button { flex: 0 0 auto; min-width: 126px; }

  .method-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .comparison-row { grid-template-columns: 28px minmax(0, 1fr) auto; }
  .comparison-bars { display: none; }
}
</style>
