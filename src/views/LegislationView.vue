<script setup>
import { computed, onMounted, ref } from 'vue'
import ApiFallbackNotice from '@/components/regional/ApiFallbackNotice.vue'
import DataOriginBadge from '@/components/regional/DataOriginBadge.vue'
import LegislationCard from '@/components/regional/LegislationCard.vue'
import LegislationFilters from '@/components/regional/LegislationFilters.vue'
import LegislationTimeline from '@/components/regional/LegislationTimeline.vue'
import { SAVED_REGION_FILTER } from '@/data/legislationData'
import { useAnalysisStore } from '@/stores/analysis'
import { useLegislationStore } from '@/stores/legislation'

const selectedRegion = ref('전체')
const selectedCategory = ref('전체')
const selectedStage = ref('전체')
const selectedTimelineItem = ref(null)
const isTimelineDetailOpen = ref(false)
const analysisStore = useAnalysisStore()
const dataStore = useLegislationStore()

const filterRegionOptions = computed(() => {
  const interestOption = {
    value: SAVED_REGION_FILTER,
    label: analysisStore.savedRegions.length
      ? `관심 지역만 보기 (${analysisStore.savedRegions.length})`
      : '관심 지역만 보기 · 저장된 지역 없음',
    disabled: analysisStore.savedRegions.length === 0,
  }

  return [interestOption, ...dataStore.regionOptions]
})

function matchesBaseFilters(item) {
  const matchesRegion =
    selectedRegion.value === '전체' ||
    (selectedRegion.value === SAVED_REGION_FILTER
      ? analysisStore.savedRegions.includes(item.region)
      : item.region === selectedRegion.value)
  const matchesCategory = selectedCategory.value === '전체' || item.category === selectedCategory.value
  return matchesRegion && matchesCategory
}

const filteredItems = computed(() =>
  dataStore.items
    .filter((item) => matchesBaseFilters(item) && (selectedStage.value === '전체' || item.stage === selectedStage.value))
    .sort((a, b) => {
      const aDate = Number(String(a.proposedAt ?? '').replaceAll('.', '')) || 0
      const bDate = Number(String(b.proposedAt ?? '').replaceAll('.', '')) || 0
      return bDate - aDate
    }),
)

const stageMenuItems = computed(() =>
  dataStore.stages
    .filter((stage) => stage.value !== '전체')
    .map((stage) => ({
      ...stage,
      count: dataStore.items.filter((item) => matchesBaseFilters(item) && item.stage === stage.value).length,
    })),
)

const resultsTitle = computed(() =>
  selectedStage.value === '전체' ? '법안 진행 정보' : `${selectedStage.value} 단계 예시`,
)

const activeRegionLabel = computed(() => {
  if (selectedRegion.value === SAVED_REGION_FILTER) {
    return analysisStore.savedRegions.length ? '저장한 관심 지역' : '관심 지역 없음'
  }

  const region = dataStore.regionOptions.find((option) => option.value === selectedRegion.value)
  return region?.label ?? '전체 지역'
})

function resetFilters() {
  selectedRegion.value = '전체'
  selectedCategory.value = '전체'
  selectedStage.value = '전체'
}

function selectStageMenu(stage) {
  selectedStage.value = stage
}

function handleRegionUpdate(value) {
  selectedRegion.value = value
}

function openTimelineDetail(item) {
  selectedTimelineItem.value = item
  isTimelineDetailOpen.value = true
}

function openTimelineSource() {
  if (selectedTimelineItem.value?.sourceUrl) {
    window.open(selectedTimelineItem.value.sourceUrl, '_blank', 'noopener,noreferrer')
  }
}

onMounted(() => {
  void dataStore.load()
})
</script>

<template>
  <div class="legislation-page">
    <nav class="analysis-tabs" aria-label="지역산업 분석 카테고리">
      <a href="/regional-industry">지역별 산업</a>
      <a href="/legislation" class="is-active" aria-current="page">법안별</a>
      <a href="/regional-case-studies">과거 사례 연구</a>
    </nav>

    <section class="legislation-hero">
      <div class="hero-copy">
        <p class="eyebrow">LEGISLATION &amp; PUBLIC NOTICE</p>
        <h1>법안·입법예고</h1>
        <p class="hero-description">
          관심 지역과 산업에 영향을 줄 수 있는 법안·입법 진행 정보를 공개자료 중심으로 정리합니다.
        </p>
        <div class="hero-note">
          <DataOriginBadge :origin="dataStore.dataOrigin" />
          <span>실제 데이터와 샘플 데이터는 카드의 배지로 구분됩니다.</span>
        </div>
      </div>

      <el-card class="hero-summary" shadow="never">
        <span>현재 확인 가능한 법안 관련 정보</span>
        <strong>{{ filteredItems.length }}<small>건</small></strong>
        <small>{{ activeRegionLabel }} · {{ dataStore.dataOriginLabel }}</small>
      </el-card>
    </section>

    <el-alert class="legislation-disclaimer" type="info" :closable="false" show-icon>
      <template #title>법안 발의·입법예고는 사업 확정이나 예산 확정을 의미하지 않습니다.</template>
      <p>
        법안의 진행 단계와 실제 지역 사업·예산 집행 여부는 서로 다른 공개자료에서 별도로 확인해야 합니다.
      </p>
    </el-alert>

    <ApiFallbackNotice
      :status="dataStore.status"
      :message="dataStore.errorMessage"
      @retry="dataStore.retry"
    />

    <section class="filter-section">
      <LegislationFilters
        :region-options="filterRegionOptions"
        :industry-categories="dataStore.industryCategories"
        :stages="dataStore.stages"
        :selected-region="selectedRegion"
        :selected-category="selectedCategory"
        :selected-stage="selectedStage"
        @update:selected-region="handleRegionUpdate"
        @update:selected-category="selectedCategory = $event"
        @update:selected-stage="selectedStage = $event"
        @reset="resetFilters"
      />
    </section>

    <section class="results-section">
      <div class="section-heading">
        <div>
          <p class="section-eyebrow">PUBLIC LEGISLATION DATA</p>
          <h2>{{ resultsTitle }}</h2>
        </div>
        <div class="results-heading__meta">
          <el-tag type="success" effect="plain">최근 제안일 순</el-tag>
          <el-tag type="info" effect="plain">{{ filteredItems.length }}건</el-tag>
        </div>
      </div>

      <section class="stage-menu-section" aria-label="법안 진행 단계 메뉴">
        <div class="stage-menu-heading">
          <div>
            <p>PROGRESS MENU</p>
            <h3>진행 단계를 선택해 예시 보기</h3>
          </div>
          <button
            type="button"
            class="stage-menu-all"
            :class="{ 'stage-menu-all--active': selectedStage === '전체' }"
            @click="selectStageMenu('전체')"
          >전체 보기</button>
        </div>
        <div class="stage-menu-grid">
          <button
            v-for="stage in stageMenuItems"
            :key="stage.value"
            type="button"
            class="stage-menu-item"
            :class="{ 'stage-menu-item--active': selectedStage === stage.value }"
            @click="selectStageMenu(stage.value)"
          >
            <span>{{ stage.label }}</span>
            <strong>{{ stage.count }}<small>건</small></strong>
            <small>{{ stage.count ? '예시 보기' : '자료 없음' }}</small>
          </button>
        </div>
      </section>

      <el-empty
        v-if="dataStore.status !== 'loading' && selectedStage === '전체'"
        class="stage-selection-empty"
        :image-size="66"
        description="진행 단계를 선택하면 해당 단계의 법안 예시와 시계열을 볼 수 있습니다."
      />

      <LegislationTimeline
        v-else-if="dataStore.status !== 'loading' && filteredItems.length"
        class="timeline-section"
        :items="filteredItems"
        @select="openTimelineDetail"
      />

      <div v-if="dataStore.status === 'loading'" class="card-grid loading-grid" aria-busy="true">
        <el-card v-for="index in 4" :key="index" class="skeleton-card" shadow="never">
          <el-skeleton animated :rows="7" />
        </el-card>
      </div>

      <div v-else-if="selectedStage !== '전체' && filteredItems.length" class="card-grid">
        <LegislationCard v-for="item in filteredItems" :key="item.id" :item="item" @select="openTimelineDetail" />
      </div>

      <el-empty
        v-else-if="selectedStage !== '전체'"
        class="empty-state"
        description="선택한 관심 지역·산업·진행 단계에 맞는 공개자료가 없습니다."
      >
        <el-button type="primary" plain @click="resetFilters">필터 초기화</el-button>
      </el-empty>
    </section>

    <el-dialog
      v-model="isTimelineDetailOpen"
      class="timeline-detail-dialog"
      :title="selectedTimelineItem?.billName"
      width="min(680px, calc(100% - 32px))"
    >
      <template v-if="selectedTimelineItem">
        <div class="timeline-detail-meta">
          <el-tag type="info" effect="plain">{{ selectedTimelineItem.recordType }}</el-tag>
          <el-tag effect="plain">{{ selectedTimelineItem.category }}</el-tag>
          <el-tag type="warning" effect="dark">{{ selectedTimelineItem.stage }}</el-tag>
        </div>
        <dl class="timeline-detail-grid">
          <div><dt>제안일</dt><dd>{{ selectedTimelineItem.proposedAt }}</dd></div>
          <div><dt>지역</dt><dd>{{ selectedTimelineItem.region }}</dd></div>
          <div><dt>제안자</dt><dd>{{ selectedTimelineItem.proposer }}</dd></div>
          <div><dt>소관기관</dt><dd>{{ selectedTimelineItem.responsibleOrg }}</dd></div>
        </dl>
        <section class="timeline-detail-copy">
          <h3>핵심 내용</h3>
          <p>{{ selectedTimelineItem.description }}</p>
          <h3>진행 단계 근거</h3>
          <p>{{ selectedTimelineItem.stageNote }}</p>
        </section>
        <ol class="timeline-detail-events">
          <li v-for="event in selectedTimelineItem.timeline" :key="`${event.date}-${event.title}`">
            <time>{{ event.date }}</time><strong>{{ event.title }}</strong><span>{{ event.description }}</span>
          </li>
        </ol>
        <div class="timeline-detail-actions">
          <el-button @click="isTimelineDetailOpen = false">닫기</el-button>
          <el-button v-if="selectedTimelineItem.sourceUrl" type="primary" @click="openTimelineSource">공식 출처 열기</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.legislation-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 56px 24px 88px;
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

.legislation-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 48px;
  border-radius: 28px;
  color: #fff;
  background:
    radial-gradient(circle at 92% 10%, rgb(251 191 36 / 24%), transparent 34%),
    linear-gradient(135deg, #312e81 0%, #1e3a8a 56%, #0f766e 130%);
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

.eyebrow {
  color: #c4b5fd;
}

.legislation-hero h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(2.3rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 1.1;
}

.hero-description {
  max-width: 640px;
  margin: 20px 0 0;
  color: #e0e7ff;
  font-size: 1.04rem;
  line-height: 1.75;
}

.hero-note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  color: #c7d2fe;
  font-size: 0.82rem;
}

.hero-summary {
  display: grid;
  flex: 0 0 240px;
  gap: 8px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 18px;
  color: #e0e7ff;
  background: rgb(15 23 42 / 24%);
}

:deep(.hero-summary .el-card__body) {
  display: grid;
  gap: 8px;
  padding: 22px;
}

.hero-summary > span,
.hero-summary > small {
  color: #c7d2fe;
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
  color: #c7d2fe;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
}

.legislation-disclaimer {
  margin-top: 24px;
  border: 1px solid #bfdbfe;
}

.legislation-disclaimer p {
  margin: 6px 0 0;
  color: #536179;
  font-size: 0.82rem;
  line-height: 1.6;
}

.filter-section,
.results-section {
  margin-top: 54px;
}

.timeline-section {
  margin-top: 32px;
}

.stage-menu-section {
  margin-top: 32px;
  padding: 24px;
  border: 1px solid #dbe7f3;
  border-radius: 20px;
  background: #fff;
}

.stage-menu-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.stage-menu-heading p { margin: 0 0 7px; color: #2563eb; font-size: .68rem; font-weight: 900; letter-spacing: .14em; }
.stage-menu-heading h3 { margin: 0; color: #172554; font-size: 1.05rem; letter-spacing: -.045em; }
.stage-menu-all { padding: 8px 11px; border: 1px solid #dbe7f3; border-radius: 9px; color: #64748b; background: #fff; font-size: .74rem; font-weight: 800; cursor: pointer; }.stage-menu-all--active { border-color: #1d4ed8; color: #fff; background: #1d4ed8; }
.stage-menu-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 9px; }.stage-menu-item { display: grid; gap: 7px; min-height: 118px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 13px; color: #64748b; background: #f8fafc; text-align: left; cursor: pointer; }.stage-menu-item:hover { border-color: #93c5fd; background: #f8fbff; }.stage-menu-item--active { border-color: #2563eb; background: #eff6ff; box-shadow: 0 6px 14px rgb(37 99 235 / 10%); }.stage-menu-item > span { color: #334155; font-size: .78rem; font-weight: 800; }.stage-menu-item strong { color: #1d4ed8; font-size: 1.55rem; letter-spacing: -.07em; line-height: 1; }.stage-menu-item strong small { margin-left: 2px; font-size: .72rem; letter-spacing: 0; }.stage-menu-item > small { color: #94a3b8; font-size: .68rem; }
.stage-selection-empty { min-height: 170px; margin-top: 18px; border: 1px dashed #d6deec; border-radius: 16px; background: #fbfdff; }

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.section-eyebrow {
  color: #2563eb;
}

.section-heading h2 {
  margin: 0;
  color: #172033;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.results-heading__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.skeleton-card {
  min-height: 380px;
  border: 1px solid #e5eaf2;
  border-radius: 18px;
}

.empty-state {
  min-height: 300px;
  border: 1px dashed #d6deec;
  border-radius: 18px;
  background: #fff;
}

.timeline-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 20px 0;
}

.timeline-detail-grid > div {
  padding: 12px;
  border-radius: 10px;
  background: #f7f9fc;
}

.timeline-detail-grid dt {
  color: #8a96aa;
  font-size: .7rem;
  font-weight: 700;
}

.timeline-detail-grid dd {
  margin: 5px 0 0;
  color: #26344d;
  font-size: .82rem;
  font-weight: 700;
  line-height: 1.45;
}

.timeline-detail-copy { display: grid; gap: 6px; }
.timeline-detail-copy h3 { margin: 8px 0 0; color: #334155; font-size: .84rem; }
.timeline-detail-copy p { margin: 0; color: #5f6d83; font-size: .82rem; line-height: 1.65; }
.timeline-detail-events { display: grid; gap: 8px; margin: 22px 0 0; padding: 0; list-style: none; }
.timeline-detail-events li { display: grid; grid-template-columns: 92px 1fr; gap: 3px 12px; padding: 12px 0; border-top: 1px solid #edf1f6; }
.timeline-detail-events time { grid-row: span 2; color: #2563eb; font-size: .76rem; font-weight: 800; }.timeline-detail-events strong { color: #334155; font-size: .8rem; }.timeline-detail-events span { color: #64748b; font-size: .74rem; line-height: 1.5; }
.timeline-detail-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }

@media (max-width: 820px) {
  .legislation-hero {
    align-items: stretch;
    display: grid;
  }

  .hero-summary {
    max-width: 280px;
  }

  .stage-menu-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 680px) {
  .legislation-page {
    padding: 32px 18px 64px;
  }

  .legislation-hero {
    padding: 32px 24px;
  }

  .hero-note {
    align-items: flex-start;
    display: grid;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .timeline-detail-grid { grid-template-columns: 1fr; }

  .stage-menu-heading { align-items: start; }
}

@media (max-width: 520px) {
  .section-heading {
    align-items: flex-start;
    display: grid;
  }

  .stage-menu-section { padding: 18px; }
  .stage-menu-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
