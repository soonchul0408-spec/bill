<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DataOriginBadge from '@/components/regional/DataOriginBadge.vue'
import LegislationCard from '@/components/regional/LegislationCard.vue'
import RegionalCompanyTable from '@/components/regional/RegionalCompanyTable.vue'
import RegionalInfoCard from '@/components/regional/RegionalInfoCard.vue'
import { useAnalysisStore } from '@/stores/analysis'
import { useNationalMapStore } from '@/stores/nationalMap'

const router = useRouter()
const mapStore = useNationalMapStore()
const analysisStore = useAnalysisStore()
const activeSection = ref('projects')

const industrySummary = computed(() =>
  [...new Set(
    [...mapStore.filteredProjects, ...mapStore.filteredBills]
      .map((record) => record.category)
      .filter(Boolean),
  )],
)

const isRegionSaved = computed(
  () =>
    mapStore.selectedRegionId !== '전체' &&
    analysisStore.isRegionSaved(mapStore.selectedRegionLabel),
)

function toggleRegion() {
  if (mapStore.selectedRegionId !== '전체') {
    analysisStore.toggleRegion(mapStore.selectedRegionLabel)
  }
}

function openMyAnalysis() {
  router.push({ name: 'my-analysis' })
}
</script>

<template>
  <section class="insight-panel">
    <div class="panel-heading">
      <div>
        <p class="section-eyebrow">REGIONAL BRIEFING</p>
        <h2>{{ mapStore.selectedRegionLabel }} 통합 분석</h2>
        <p>정책·예산·법안·사업·기업 정보를 같은 필터 조건으로 묶어 확인합니다.</p>
      </div>
      <div class="panel-actions">
        <DataOriginBadge :origin="mapStore.dataOrigin" />
        <el-button
          type="success"
          plain
          :disabled="mapStore.selectedRegionId === '전체'"
          @click="toggleRegion"
        >
          {{ isRegionSaved ? '관심 지역 해제' : '관심 지역 저장' }}
        </el-button>
        <el-button type="primary" plain @click="openMyAnalysis">내 분석 보기</el-button>
      </div>
    </div>

    <div class="summary-grid">
      <el-card shadow="never">
        <span>정책·예산·사업</span>
        <strong>{{ mapStore.summary.projectCount }}</strong>
        <small>건</small>
      </el-card>
      <el-card shadow="never">
        <span>법안·입법예고</span>
        <strong>{{ mapStore.summary.billCount }}</strong>
        <small>건</small>
      </el-card>
      <el-card shadow="never">
        <span>관련 기업</span>
        <strong>{{ mapStore.summary.companyCount }}</strong>
        <small>개</small>
      </el-card>
      <el-card shadow="never">
        <span>관련 산업</span>
        <strong>{{ mapStore.summary.categoryCount }}</strong>
        <small>개 분야</small>
      </el-card>
    </div>

    <div class="industry-summary">
      <span>현재 확인된 산업 카테고리</span>
      <el-tag v-for="industry in industrySummary" :key="industry" type="primary" effect="plain">
        {{ industry }}
      </el-tag>
      <span v-if="!industrySummary.length" class="muted-copy">조건에 맞는 산업 정보가 없습니다.</span>
    </div>

    <nav class="briefing-menu" aria-label="지역 통합 분석 항목">
      <button type="button" :class="{ 'briefing-menu__item--active': activeSection === 'projects' }" @click="activeSection = 'projects'">
        정책·사업 <strong>{{ mapStore.filteredProjects.length }}</strong>
      </button>
      <button type="button" :class="{ 'briefing-menu__item--active': activeSection === 'bills' }" @click="activeSection = 'bills'">
        법안·입법예고 <strong>{{ mapStore.filteredBills.length }}</strong>
      </button>
      <button type="button" :class="{ 'briefing-menu__item--active': activeSection === 'companies' }" @click="activeSection = 'companies'">
        관련 기업 <strong>{{ mapStore.relatedCompanies.length }}</strong>
      </button>
    </nav>

    <section v-if="activeSection === 'projects'" class="content-section briefing-content">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">POLICY &amp; PROJECT</p>
            <h3>정책·예산·진행 중인 사업</h3>
          </div>
          <el-tag type="primary" effect="plain">{{ mapStore.filteredProjects.length }}건</el-tag>
        </div>

        <div v-if="mapStore.filteredProjects.length" class="project-card-grid">
          <RegionalInfoCard
            v-for="project in mapStore.filteredProjects"
            :key="project.id"
            :item="project"
          />
        </div>
        <el-empty v-else description="선택한 지역과 조건에 맞는 정책·사업이 없습니다." />
    </section>

    <section v-else-if="activeSection === 'bills'" class="content-section briefing-content">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">LEGISLATION</p>
            <h3>법안·입법예고</h3>
          </div>
          <el-tag type="warning" effect="plain">{{ mapStore.filteredBills.length }}건</el-tag>
        </div>

        <div v-if="mapStore.filteredBills.length" class="bill-card-grid">
          <LegislationCard
            v-for="bill in mapStore.filteredBills"
            :key="bill.id"
            :item="bill"
          />
        </div>
        <el-empty v-else description="선택한 지역과 조건에 맞는 법안이 없습니다." />
    </section>

    <section v-else class="company-section briefing-content">
      <div class="section-heading">
        <div>
          <p class="section-eyebrow">CONNECTED COMPANIES</p>
          <h3>공개자료 기반 관련 기업</h3>
          <p>산업 연관성과 직접 참여 여부를 구분해 표시합니다.</p>
        </div>
        <el-tag type="success" effect="plain">{{ mapStore.relatedCompanies.length }}개 기업</el-tag>
      </div>

      <el-alert type="info" :closable="false" show-icon>
        산업 관련성이 실제 사업 참여나 투자 판단을 의미하지는 않습니다.
      </el-alert>

      <RegionalCompanyTable
        v-if="mapStore.relatedCompanies.length"
        :companies="mapStore.relatedCompanies"
      />
      <el-empty v-else description="선택한 지역과 조건에 맞는 관련 기업이 없습니다." />
    </section>
  </section>
</template>

<style scoped>
.insight-panel {
  margin-top: 42px;
}

.panel-heading,
.section-heading,
.panel-actions {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.panel-heading {
  align-items: flex-start;
}

.section-eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.panel-heading h2,
.section-heading h3 {
  margin: 0;
  color: #172033;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.panel-heading h2 {
  font-size: 1.65rem;
}

.section-heading h3 {
  font-size: 1.2rem;
}

.panel-heading p:not(.section-eyebrow),
.section-heading p:not(.section-eyebrow) {
  margin: 10px 0 0;
  color: #738096;
  font-size: 0.84rem;
  line-height: 1.6;
}

.panel-actions {
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.summary-grid .el-card {
  border: 1px solid #e5eaf2;
  border-radius: 16px;
}

:deep(.summary-grid .el-card__body) {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 5px;
  padding: 18px;
}

.summary-grid span {
  width: 100%;
  color: #8a96aa;
  font-size: 0.75rem;
  font-weight: 700;
}

.summary-grid strong {
  color: #172033;
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.08em;
}

.summary-grid small {
  color: #738096;
  font-size: 0.74rem;
}

.industry-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  color: #8a96aa;
  font-size: 0.75rem;
  font-weight: 700;
}

.content-section,
.company-section {
  min-width: 0;
}

.briefing-menu { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 32px; padding: 6px; border: 1px solid #dbe7f3; border-radius: 16px; background: #f8fbff; }.briefing-menu button { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 13px; border: 0; border-radius: 11px; color: #64748b; background: transparent; font-size: .8rem; font-weight: 800; cursor: pointer; }.briefing-menu button:hover { color: #1d4ed8; }.briefing-menu button strong { color: inherit; font-size: 1.05rem; }.briefing-menu .briefing-menu__item--active { color: #fff; background: #1d4ed8; box-shadow: 0 5px 12px rgb(29 78 216 / 18%); }.briefing-content { margin-top: 20px; }

.section-heading {
  align-items: flex-end;
  margin-bottom: 16px;
}

.project-card-grid,
.bill-card-grid {
  display: grid;
  gap: 16px;
}

.project-card-grid :deep(.info-card),
.bill-card-grid :deep(.legislation-card) {
  min-height: 0;
}

.company-section {
  margin-top: 42px;
}

.company-section > :deep(.el-alert) {
  margin-bottom: 16px;
}

.muted-copy {
  color: #96a0b1;
  font-size: 0.75rem;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 640px) {
  .panel-heading,
  .panel-actions {
    align-items: flex-start;
    display: grid;
    justify-content: stretch;
  }

  .panel-actions {
    justify-items: start;
  }

  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }

  .briefing-menu { grid-template-columns: 1fr; }
}
</style>
