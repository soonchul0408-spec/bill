<script setup>
import { useRouter } from 'vue-router'
import DataOriginBadge from '@/components/regional/DataOriginBadge.vue'
import SourceMeta from '@/components/regional/SourceMeta.vue'

defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const router = useRouter()

const categoryTagTypes = {
  'AI·데이터센터': 'primary',
  반도체: 'success',
  방산: 'danger',
  이차전지: 'warning',
  '전력·에너지': 'info',
}

const stageTagTypes = {
  발의: 'info',
  입법예고: 'warning',
  '상임위 심사': 'warning',
  '본회의 심사': 'primary',
  통과: 'success',
  '계류·폐기': 'danger',
}

const researchHints = {
  발의: {
    type: 'info',
    icon: '1',
    title: '지금은 초기 확인 단계',
    text: '직접 참여 기업을 정하지 말고 법안 원문과 적용 산업부터 확인하세요.',
  },
  입법예고: {
    type: 'warning',
    icon: '2',
    title: '의견·수정 가능 단계',
    text: '후속 심사와 예산 반영 여부를 함께 확인하세요.',
  },
  '상임위 심사': {
    type: 'warning',
    icon: '3',
    title: '후속 자료 확인 단계',
    text: '정부·지자체 계획과 기업 협약이 공개되는지 살펴보세요.',
  },
  '본회의 심사': {
    type: 'primary',
    icon: '4',
    title: '현실화 가능성 점검',
    text: '통과 이후 예산·고시·사업자 선정까지 남아 있는지 확인하세요.',
  },
  통과: {
    type: 'success',
    icon: '5',
    title: '집행 근거 확인 단계',
    text: '사업 공고·협약·DART 공시로 실제 기업 연결을 검토하세요.',
  },
  '계류·폐기': {
    type: 'danger',
    icon: '!',
    title: '후보 제외 또는 재확인',
    text: '법안 상태가 바뀌기 전에는 관련 기업 후보를 보수적으로 보세요.',
  },
}

function getTagType(types, value) {
  return types[value] ?? 'info'
}

function goToRelatedResearch(item) {
  router.push({
    name: 'case-studies',
    query: { category: item.category, region: item.region },
  })
}

function getResearchHint(stage) {
  return researchHints[stage] ?? researchHints.발의
}
</script>

<template>
  <el-card class="legislation-card" shadow="hover">
    <div class="card-kicker">
      <div class="kicker-left">
        <el-tag size="small" type="info" effect="plain">{{ item.recordType }}</el-tag>
        <span>{{ item.region }}</span>
      </div>
      <DataOriginBadge :origin="item.dataOrigin" />
    </div>

    <div class="card-title-row">
      <div>
        <p class="bill-number">의안번호 {{ item.billNumber }}</p>
        <h3>{{ item.billName }}</h3>
      </div>
      <el-tag :type="getTagType(stageTagTypes, item.stage)" effect="dark">
        {{ item.stage }}
      </el-tag>
    </div>

    <div class="category-row">
      <el-tag :type="getTagType(categoryTagTypes, item.category)" effect="plain">
        {{ item.category }}
      </el-tag>
      <span>제안일 {{ item.proposedAt }}</span>
    </div>

    <dl class="bill-details">
      <div>
        <dt>제안자</dt>
        <dd>{{ item.proposer }}</dd>
      </div>
      <div>
        <dt>소관기관</dt>
        <dd>{{ item.responsibleOrg }}</dd>
      </div>
    </dl>

    <p class="card-description">{{ item.description }}</p>

    <div class="stage-note">
      <span>진행 단계 근거</span>
      <p>{{ item.stageNote }}</p>
    </div>

    <div class="research-hint" :class="`research-hint--${getResearchHint(item.stage).type}`">
      <span class="research-hint__icon">{{ getResearchHint(item.stage).icon }}</span>
      <div>
        <strong>{{ getResearchHint(item.stage).title }}</strong>
        <p>{{ getResearchHint(item.stage).text }}</p>
      </div>
    </div>

    <div class="card-footer">
      <SourceMeta :item="item" />
      <div class="card-actions">
        <el-button size="small" plain @click="goToRelatedResearch(item)">유사 사례 보기</el-button>
        <el-link
          v-if="item.sourceUrl"
          :href="item.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          type="primary"
        >
          공식 출처 ↗
        </el-link>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.legislation-card {
  height: 100%;
  border: 1px solid #e5eaf2;
  border-radius: 18px;
  background: #fff;
}

:deep(.legislation-card .el-card__body) {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 24px;
}

.card-kicker,
.card-title-row,
.card-footer,
.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kicker-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #738096;
  font-size: 0.82rem;
}

.card-title-row {
  align-items: flex-start;
  margin-top: 18px;
}

.bill-number {
  margin: 0 0 6px;
  color: #8a96aa;
  font-size: 0.72rem;
  font-weight: 700;
}

.card-title-row h3 {
  max-width: 590px;
  margin: 0;
  color: #172033;
  font-size: 1.16rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.4;
}

.category-row {
  justify-content: flex-start;
  margin-top: 16px;
  color: #738096;
  font-size: 0.78rem;
}

.bill-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0 18px;
}

.bill-details > div {
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
  padding: 13px;
  border-radius: 12px;
  background: #f7f9fc;
}

dt,
.stage-note > span {
  color: #8a96aa;
  font-size: 0.72rem;
  font-weight: 700;
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #26344d;
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.45;
}

.card-description {
  min-height: 4.2rem;
  margin: 0;
  color: #5f6d83;
  font-size: 0.9rem;
  line-height: 1.7;
}

.stage-note {
  display: grid;
  gap: 5px;
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #e8eef8;
  border-radius: 12px;
  background: #fbfcff;
}

.stage-note p {
  margin: 0;
  color: #536179;
  font-size: 0.78rem;
  line-height: 1.55;
}

.research-hint {
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 9px;
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f1f5f9;
}

.research-hint--success { background: #ecfdf5; }
.research-hint--warning { background: #fffbeb; }
.research-hint--danger { background: #fef2f2; }
.research-hint--primary { background: #eff6ff; }

.research-hint__icon {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #64748b;
  font-size: .72rem;
  font-weight: 900;
}

.research-hint--success .research-hint__icon { background: #10b981; }
.research-hint--warning .research-hint__icon { background: #f59e0b; }
.research-hint--danger .research-hint__icon { background: #ef4444; }
.research-hint--primary .research-hint__icon { background: #2563eb; }

.research-hint strong { color: #334155; font-size: .76rem; }
.research-hint p { margin: 3px 0 0; color: #64748b; font-size: .72rem; line-height: 1.5; }

.card-footer {
  align-items: flex-end;
  margin-top: auto;
  padding-top: 20px;
}

.card-footer :deep(.el-link) {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 800;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 520px) {
  :deep(.legislation-card .el-card__body) {
    padding: 20px;
  }

  .card-title-row {
    display: grid;
  }

  .bill-details {
    grid-template-columns: 1fr;
  }

  .card-footer {
    align-items: flex-start;
    display: grid;
    gap: 14px;
  }

  .card-actions {
    display: grid;
    justify-content: stretch;
    width: 100%;
  }

  .card-actions :deep(.el-button),
  .card-actions :deep(.el-link) {
    justify-content: center;
    width: 100%;
    min-height: 38px;
    border: 1px solid #dbeafe;
    border-radius: 9px;
  }

  .card-actions :deep(.el-link) {
    color: #2563eb;
    background: #f8fbff;
  }
}
</style>
