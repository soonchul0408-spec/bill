<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ApiFallbackNotice from '@/components/regional/ApiFallbackNotice.vue'
import DataOriginBadge from '@/components/regional/DataOriginBadge.vue'
import NationalKoreaMap from '@/components/nationalMap/NationalKoreaMap.vue'
import NationalMapFilters from '@/components/nationalMap/NationalMapFilters.vue'
import RegionalInsightPanel from '@/components/nationalMap/RegionalInsightPanel.vue'
import { useNationalMapStore } from '@/stores/nationalMap'

const router = useRouter()
const mapStore = useNationalMapStore()
const activeView = ref('map')

const topRegions = computed(() =>
  [...mapStore.mapRegions]
    .sort((left, right) => right.projectCount - left.projectCount)
    .slice(0, 5),
)

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
}
</style>
