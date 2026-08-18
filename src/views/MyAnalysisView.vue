<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ApiFallbackNotice from '@/components/regional/ApiFallbackNotice.vue'
import DataOriginBadge from '@/components/regional/DataOriginBadge.vue'
import SavedAnalysisCard from '@/components/analysis/SavedAnalysisCard.vue'
import { CASE_STUDIES } from '@/data/caseStudies'
import { COMPANY_RELATION_STATUSES } from '@/data/regionalIndustryCompanies'
import { useAnalysisStore } from '@/stores/analysis'
import { useRegionalIndustryStore } from '@/stores/regionalIndustry'

const router = useRouter()
const analysisStore = useAnalysisStore()
const dataStore = useRegionalIndustryStore()
const memoDialogVisible = ref(false)
const editingProjectId = ref('')
const videoNoteDialogVisible = ref(false)
const editingVideoNoteId = ref('')
const selectedVideoNoteStatus = ref('전체')
const DART_SEARCH_URL = 'https://dart.fss.or.kr/dsab001/main.do?autoSearch=true&textCrpNm='

function createEmptyMemo() {
  return {
    interestReason: '',
    judgmentBasis: '',
    expectedScenario: '',
    concerns: '',
    nextChecks: '',
  }
}

function createEmptyVideoNote() {
  return {
    sourceName: '',
    sourceUrl: '',
    watchedAt: '',
    companyName: '',
    reviewStatus: '기록만',
    claim: '',
    verifiedFacts: '',
    concerns: '',
    nextChecks: '',
    linkedCaseId: '',
    linkedProjectId: '',
    verificationChecks: {
      disclosure: false,
      policy: false,
      caseStudy: false,
      counterArgument: false,
    },
  }
}

const memoForm = reactive(createEmptyMemo())
const videoNoteForm = reactive(createEmptyVideoNote())

const savedProjects = computed(() =>
  dataStore.items.filter((item) => analysisStore.savedProjectIds.includes(item.id)),
)

const savedCompanies = computed(() =>
  dataStore.companies.filter((company) => analysisStore.savedCompanyIds.includes(company.id)),
)
const savedResearchCandidates = computed(() => analysisStore.savedResearchCandidates)
const videoResearchNotes = computed(() =>
  [...analysisStore.videoResearchNotes].sort((a, b) =>
    String(b.updatedAt ?? b.createdAt ?? '').localeCompare(String(a.updatedAt ?? a.createdAt ?? '')),
  ),
)
const filteredVideoResearchNotes = computed(() =>
  selectedVideoNoteStatus.value === '전체'
    ? videoResearchNotes.value
    : videoResearchNotes.value.filter((note) => note.reviewStatus === selectedVideoNoteStatus.value),
)
const videoNoteStatusCounts = computed(() => ({
  all: videoResearchNotes.value.length,
  recording: videoResearchNotes.value.filter((note) => note.reviewStatus === '기록만').length,
  checking: videoResearchNotes.value.filter((note) => note.reviewStatus === '공식 자료 확인 중').length,
  paused: videoResearchNotes.value.filter((note) => note.reviewStatus === '보류').length,
  completed: videoResearchNotes.value.filter((note) => note.reviewStatus === '검토 완료').length,
}))
const videoNotesToCheck = computed(() =>
  videoResearchNotes.value
    .filter((note) => ['기록만', '공식 자료 확인 중'].includes(note.reviewStatus))
    .sort((a, b) => {
      const priority = { '공식 자료 확인 중': 0, 기록만: 1 }
      return priority[a.reviewStatus] - priority[b.reviewStatus]
    }),
)
const videoCompanyMentionCounts = computed(() =>
  videoResearchNotes.value.reduce((counts, note) => {
    const companyName = note.companyName.trim()
    if (companyName) counts[companyName] = (counts[companyName] ?? 0) + 1
    return counts
  }, {}),
)
const shortlistedStudies = computed(() =>
  CASE_STUDIES.filter((study) =>
    savedResearchCandidates.value.some((candidate) => candidate.caseId === study.id),
  ),
)
const writtenCaseNotes = computed(() =>
  CASE_STUDIES.map((study) => ({
    study,
    note: analysisStore.getProjectNote(study.id),
  })).filter(({ note }) =>
    [note.interestReason, note.judgmentBasis, note.concerns, note.nextChecks].some((value) =>
      String(value ?? '').trim(),
    ),
  ),
)
const researchCheckProgress = computed(() => {
  const total = shortlistedStudies.value.length * 5
  const completed = shortlistedStudies.value.reduce(
    (count, study) =>
      count +
      ['source', 'directness', 'disclosure', 'market', 'risk'].filter((checkId) =>
        analysisStore.isResearchCheckComplete(study.id, checkId),
      ).length,
    0,
  )

  return {
    completed,
    total,
    percentage: total ? Math.round((completed / total) * 100) : 0,
  }
})

const savedItemCount = computed(
  () =>
    analysisStore.savedRegions.length +
      savedProjects.value.length +
      savedCompanies.value.length +
      savedResearchCandidates.value.length +
      writtenCaseNotes.value.length +
      videoResearchNotes.value.length,
)

const hasSavedData = computed(
  () =>
    analysisStore.savedRegions.length > 0 ||
    savedProjects.value.length > 0 ||
    savedCompanies.value.length > 0 ||
    savedResearchCandidates.value.length > 0 ||
    writtenCaseNotes.value.length > 0 ||
    videoResearchNotes.value.length > 0,
)

function getRelatedCompanies(project) {
  return dataStore.getRelatedCompanies(project)
}

function getCompanyProjects(company) {
  return dataStore.items.filter((project) => (company.projectIds ?? []).includes(project.id))
}

function getSavedProjectCount(region) {
  return savedProjects.value.filter((project) => project.region === region).length
}

function getStatusType(status) {
  return COMPANY_RELATION_STATUSES.find((item) => item.value === status)?.type ?? 'info'
}

function openProject(projectId) {
  router.push({ name: 'regional-industry-detail', params: { id: projectId } })
}

function removeRegion(region) {
  analysisStore.toggleRegion(region)
}

function removeCompany(companyId) {
  analysisStore.toggleCompany(companyId)
}

function removeResearchCandidate(candidate) {
  analysisStore.toggleResearchCandidate(candidate)
}

function updateCompanyWeight(companyId, weight) {
  analysisStore.setCompanyWeight(companyId, weight)
}

function getDartSearchUrl(companyName) {
  return `${DART_SEARCH_URL}${encodeURIComponent(companyName)}`
}

function openMemoDialog(projectId) {
  editingProjectId.value = projectId
  Object.assign(memoForm, analysisStore.getProjectNote(projectId))
  memoDialogVisible.value = true
}

function closeMemoDialog() {
  memoDialogVisible.value = false
}

function saveMemo() {
  if (!editingProjectId.value) return

  analysisStore.updateProjectNote(editingProjectId.value, { ...memoForm })
  closeMemoDialog()
}

function openVideoNoteDialog(note = null) {
  editingVideoNoteId.value = note?.id ?? ''
  const emptyNote = createEmptyVideoNote()
  Object.assign(videoNoteForm, emptyNote, note ?? {})
  videoNoteForm.verificationChecks = {
    ...emptyNote.verificationChecks,
    ...(note?.verificationChecks ?? {}),
  }
  videoNoteDialogVisible.value = true
}

function saveVideoNote() {
  if (!videoNoteForm.sourceName.trim() || !videoNoteForm.companyName.trim()) return

  analysisStore.saveVideoResearchNote({
    ...videoNoteForm,
    id: editingVideoNoteId.value,
  })
  videoNoteDialogVisible.value = false
}

function getLinkedStudyTitle(caseId) {
  return CASE_STUDIES.find((study) => study.id === caseId)?.title ?? ''
}

function getLinkedProjectTitle(projectId) {
  return dataStore.items.find((project) => project.id === projectId)?.projectName ?? '연결 정책·사업'
}

function getVideoNoteStatusType(status) {
  return {
    기록만: 'info',
    '공식 자료 확인 중': 'warning',
    보류: 'danger',
    '검토 완료': 'success',
  }[status] ?? 'info'
}

function getVideoCompanyMentionCount(companyName) {
  return videoCompanyMentionCounts.value[companyName] ?? 0
}

function getVideoVerificationCount(note) {
  return ['disclosure', 'policy', 'caseStudy', 'counterArgument'].filter(
    (checkId) => note.verificationChecks?.[checkId],
  ).length
}

function escapeCsvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function downloadVideoResearchNotes() {
  const headers = ['방송·채널', '시청 날짜', '기업', '검토 상태', '방송 주장', '확인한 사실', '보류·제외 조건', '다음 확인', '영상 링크']
  const rows = videoResearchNotes.value.map((note) => [
    note.sourceName,
    note.watchedAt,
    note.companyName,
    note.reviewStatus,
    note.claim,
    note.verifiedFacts,
    note.concerns,
    note.nextChecks,
    note.sourceUrl,
  ])
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `방송-유튜브-검증기록-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

function goToRegionalIndustry() {
  router.push({ name: 'regional-industry' })
}

onMounted(() => {
  void dataStore.load()
})
</script>

<template>
  <div class="my-analysis-page">
    <section class="analysis-hero">
      <div class="hero-copy">
        <p class="eyebrow">PERSONAL RESEARCH</p>
        <h1>내 분석</h1>
        <p class="hero-description">
          관심 지역·정책·사업·기업을 모아보고, 공개자료를 바탕으로 나만의 분석 메모를 기록하세요.
        </p>
        <div class="research-notice">
          <DataOriginBadge :origin="dataStore.dataOrigin" />
          <el-tag type="success" effect="dark">공개자료 기반 개인 리서치 기록</el-tag>
          <p>이 서비스는 투자 추천이 아니라 정보 정리와 개인 판단 기록을 위한 서비스입니다.</p>
        </div>
      </div>

      <el-card class="analysis-summary" shadow="never">
        <span>저장 항목</span>
        <strong>{{ savedItemCount }}<small>건</small></strong>
        <small>
          지역 {{ analysisStore.savedRegions.length }} · 정책·사업 {{ savedProjects.length }} · 기업
          {{ savedCompanies.length }} · 공부 목록 {{ savedResearchCandidates.length }} · 판단 노트
          {{ writtenCaseNotes.length }} · 방송 기록 {{ videoResearchNotes.length }}
        </small>
      </el-card>
    </section>

    <ApiFallbackNotice
      :status="dataStore.status"
      :message="dataStore.errorMessage"
      @retry="dataStore.retry"
    />

    <div v-if="!hasSavedData" class="empty-container">
      <el-empty description="저장한 관심 정보가 없습니다.">
        <div class="empty-actions">
          <el-button type="success" @click="openVideoNoteDialog()">방송 기록 남기기</el-button>
          <el-button type="primary" plain @click="goToRegionalIndustry">지역산업 분석에서 정보 찾아보기</el-button>
        </div>
      </el-empty>
    </div>

    <template v-else>
      <section class="analysis-section video-notes-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">VIDEO TO RESEARCH</p>
            <h2>방송·유튜브 검증 노트</h2>
          </div>
          <div class="video-notes-header-actions">
            <el-button v-if="videoResearchNotes.length" plain @click="downloadVideoResearchNotes">기록 백업</el-button>
            <el-button type="success" @click="openVideoNoteDialog()">+ 방송 기록</el-button>
          </div>
        </div>

        <p class="video-notes-intro">방송에서 들은 기업을 추천 목록이 아닌, 확인할 주장으로 기록합니다. 반복 언급은 공식 근거가 아닙니다.</p>

        <el-card v-if="videoNotesToCheck.length" class="video-review-queue" shadow="never">
          <div>
            <span>오늘 먼저 확인할 방송 기록</span>
            <small>공식 자료를 아직 확인하지 않았거나 확인 중인 항목입니다.</small>
          </div>
          <div class="video-review-queue__items">
            <el-button
              v-for="note in videoNotesToCheck.slice(0, 5)"
              :key="note.id"
              type="success"
              plain
              @click="openVideoNoteDialog(note)"
            >
              {{ note.companyName }} · {{ note.reviewStatus }}
            </el-button>
          </div>
        </el-card>

        <div v-if="videoResearchNotes.length" class="video-note-filters" aria-label="방송 기록 검토 상태 필터">
          <el-button :type="selectedVideoNoteStatus === '전체' ? 'primary' : 'default'" round @click="selectedVideoNoteStatus = '전체'">전체 {{ videoNoteStatusCounts.all }}</el-button>
          <el-button :type="selectedVideoNoteStatus === '기록만' ? 'primary' : 'default'" round @click="selectedVideoNoteStatus = '기록만'">기록만 {{ videoNoteStatusCounts.recording }}</el-button>
          <el-button :type="selectedVideoNoteStatus === '공식 자료 확인 중' ? 'primary' : 'default'" round @click="selectedVideoNoteStatus = '공식 자료 확인 중'">확인 중 {{ videoNoteStatusCounts.checking }}</el-button>
          <el-button :type="selectedVideoNoteStatus === '보류' ? 'primary' : 'default'" round @click="selectedVideoNoteStatus = '보류'">보류 {{ videoNoteStatusCounts.paused }}</el-button>
          <el-button :type="selectedVideoNoteStatus === '검토 완료' ? 'primary' : 'default'" round @click="selectedVideoNoteStatus = '검토 완료'">완료 {{ videoNoteStatusCounts.completed }}</el-button>
        </div>

        <div v-if="filteredVideoResearchNotes.length" class="video-note-grid">
          <el-card v-for="note in filteredVideoResearchNotes" :key="note.id" class="video-note-card" shadow="never">
            <div class="video-note-card__head">
              <div>
                <span>{{ note.sourceName }}</span>
                <h3>{{ note.companyName }}</h3>
                <small v-if="note.watchedAt">시청 {{ note.watchedAt }}</small>
              </div>
              <div class="video-note-card__buttons">
                <el-tag v-if="getVideoCompanyMentionCount(note.companyName) > 1" type="warning" size="small" effect="plain">
                  방송 기록 {{ getVideoCompanyMentionCount(note.companyName) }}회
                </el-tag>
                <el-tag :type="getVideoNoteStatusType(note.reviewStatus)" size="small" effect="plain">{{ note.reviewStatus }}</el-tag>
                <el-button text type="primary" @click="openVideoNoteDialog(note)">수정</el-button>
                <el-button text type="danger" @click="analysisStore.removeVideoResearchNote(note.id)">삭제</el-button>
              </div>
            </div>
            <div v-if="note.claim" class="video-note-card__item">
              <small>방송에서 들은 주장</small>
              <p>{{ note.claim }}</p>
            </div>
            <div class="video-note-card__progress">
              <span>검증 체크 {{ getVideoVerificationCount(note) }}/4</span>
              <el-progress :percentage="getVideoVerificationCount(note) * 25" :show-text="false" :stroke-width="7" />
            </div>
            <div v-if="note.verifiedFacts" class="video-note-card__item video-note-card__item--fact">
              <small>내가 확인한 사실</small>
              <p>{{ note.verifiedFacts }}</p>
            </div>
            <div v-if="note.concerns" class="video-note-card__item video-note-card__item--caution">
              <small>보류·제외 조건</small>
              <p>{{ note.concerns }}</p>
            </div>
            <div class="video-note-card__actions">
              <el-link v-if="note.sourceUrl" :href="note.sourceUrl" target="_blank" rel="noopener noreferrer" type="primary">영상 열기 ↗</el-link>
              <el-link :href="getDartSearchUrl(note.companyName)" target="_blank" rel="noopener noreferrer" type="primary">DART 확인 ↗</el-link>
              <el-link v-if="note.linkedCaseId" type="primary" @click="router.push({ name: 'case-study-detail', params: { id: note.linkedCaseId } })">
                {{ getLinkedStudyTitle(note.linkedCaseId) }} 보기 →
              </el-link>
              <el-link v-if="note.linkedProjectId" type="primary" @click="openProject(note.linkedProjectId)">
                {{ getLinkedProjectTitle(note.linkedProjectId) }} 보기 →
              </el-link>
            </div>
          </el-card>
        </div>
        <el-empty v-else :image-size="64" :description="videoResearchNotes.length ? '선택한 상태에 해당하는 기록이 없습니다.' : '방송에서 들은 내용을 기록해 보세요.'">
          <el-button type="success" plain @click="openVideoNoteDialog()">첫 방송 기록 남기기</el-button>
        </el-empty>
      </section>

      <section v-if="analysisStore.savedRegions.length" class="analysis-section regions-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">SAVED REGIONS</p>
            <h2>관심 지역</h2>
          </div>
          <el-tag type="success" effect="plain">{{ analysisStore.savedRegions.length }}개 지역</el-tag>
        </div>

        <el-card class="regions-card" shadow="never">
          <div class="region-list">
            <div v-for="region in analysisStore.savedRegions" :key="region" class="region-row">
              <div>
                <el-tag type="success">{{ region }}</el-tag>
                <span>{{ getSavedProjectCount(region) }}개 저장 사업</span>
              </div>
              <el-button text type="danger" @click="removeRegion(region)">관심 지역 해제</el-button>
            </div>
          </div>
        </el-card>
      </section>

      <section class="analysis-section projects-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">SAVED POLICY &amp; PROJECTS</p>
            <h2>저장한 정책·사업</h2>
          </div>
          <el-tag type="primary" effect="plain">{{ savedProjects.length }}개</el-tag>
        </div>

        <div v-if="savedProjects.length" class="project-list">
          <SavedAnalysisCard
            v-for="project in savedProjects"
            :key="project.id"
            :project="project"
            :related-companies="getRelatedCompanies(project)"
            @edit-memo="openMemoDialog"
          />
        </div>
        <el-empty v-else description="저장한 정책·사업이 없습니다.">
          <el-button type="primary" plain @click="goToRegionalIndustry">
            정책·사업 찾아보기
          </el-button>
        </el-empty>
      </section>

      <section class="analysis-section companies-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">SAVED COMPANIES</p>
            <h2>관심 기업</h2>
          </div>
          <el-tag type="info" effect="plain">{{ savedCompanies.length }}개</el-tag>
        </div>

        <div v-if="savedCompanies.length" class="company-grid">
          <el-card v-for="company in savedCompanies" :key="company.id" class="company-card" shadow="never">
            <template #header>
              <div class="company-card-header">
                <div>
                  <h3>{{ company.companyName }}</h3>
                  <div class="company-header-tags">
                    <el-tag :type="getStatusType(company.relationStatus)" size="small" effect="plain">
                      {{ company.relationStatus }}
                    </el-tag>
                    <DataOriginBadge :origin="company.dartDataOrigin ?? company.dataOrigin" />
                    <el-tag v-if="company.dataOrigin === 'mixed'" type="warning" size="small" effect="plain">
                      연결 정보 일부 샘플
                    </el-tag>
                  </div>
                </div>
                <el-button text type="danger" @click="removeCompany(company.id)">관심 해제</el-button>
              </div>
            </template>

            <div class="industry-tags">
              <el-tag v-for="industry in company.industries" :key="industry" effect="plain">
                {{ industry }}
              </el-tag>
            </div>
            <p class="company-business">{{ company.mainBusiness }}</p>
            <p v-if="company.dartBusinessSummary" class="dart-business-summary">
              {{ company.dartBusinessSummary }}
            </p>

            <dl class="company-details">
              <div>
                <dt>해당 사업과 연결되는 이유</dt>
                <dd>{{ company.relationReason }}</dd>
              </div>
              <div>
                <dt>직접 참여 여부</dt>
                <dd>{{ company.directParticipation }}</dd>
              </div>
              <div>
                <dt>연결 근거</dt>
                <dd>{{ company.connectionBasis }}</dd>
              </div>
            </dl>

            <div class="linked-projects">
              <span>연결된 정책·사업</span>
              <div>
                <el-button
                  v-for="project in getCompanyProjects(company)"
                  :key="project.id"
                  text
                  type="primary"
                  @click="openProject(project.id)"
                >
                  {{ project.projectName }}
                </el-button>
              </div>
            </div>

            <div class="company-dart-links">
              <span>DART 공시 출처</span>
              <div v-if="company.dartDisclosures?.length" class="dart-disclosure-list">
                <el-link
                  v-for="disclosure in company.dartDisclosures.slice(0, 3)"
                  :key="disclosure.receiptNo"
                  :href="disclosure.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  type="primary"
                >
                  {{ disclosure.reportName }} ↗
                </el-link>
              </div>
              <el-link
                v-else
                :href="getDartSearchUrl(company.companyName)"
                target="_blank"
                rel="noopener noreferrer"
                type="primary"
              >
                DART 기업검색 ↗
              </el-link>
              <small v-if="company.verifiedAt">확인 {{ company.verifiedAt }}</small>
            </div>

            <div class="company-interest-control">
              <div class="interest-heading">
                <span>개인 관심 비중</span>
                <strong>{{ analysisStore.getCompanyWeight(company.id) }}%</strong>
              </div>
              <el-progress :percentage="analysisStore.getCompanyWeight(company.id)" />
              <div class="interest-input-row">
                <el-input-number
                  :model-value="analysisStore.getCompanyWeight(company.id)"
                  :min="0"
                  :max="100"
                  :step="5"
                  controls-position="right"
                  aria-label="개인 관심 비중 입력"
                  @update:model-value="updateCompanyWeight(company.id, $event)"
                />
                <small>권장 비율이 아닌 사용자가 설정하는 개인 관심 비중입니다.</small>
              </div>
            </div>

            <el-link
              class="company-link"
              :href="company.officialUrl"
              target="_blank"
              rel="noopener noreferrer"
              type="primary"
            >
              {{ company.officialLinkLabel }} ↗
            </el-link>
          </el-card>
        </div>
        <el-empty v-else description="관심 기업으로 추가한 기업이 없습니다.">
          <el-button type="primary" plain @click="goToRegionalIndustry">
            관련 기업 찾아보기
          </el-button>
        </el-empty>
      </section>

      <section class="analysis-section research-candidates-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">RESEARCH SHORTLIST</p>
            <h2>케이스 스터디 공부 목록</h2>
          </div>
          <el-tag type="warning" effect="plain">{{ savedResearchCandidates.length }}개</el-tag>
        </div>

        <div v-if="savedResearchCandidates.length" class="research-candidate-grid">
          <el-card v-for="candidate in savedResearchCandidates" :key="candidate.id" class="research-candidate-card" shadow="never">
            <div class="research-candidate-card__head">
              <div>
                <span>{{ candidate.caseTitle }}</span>
                <h3>{{ candidate.companyName }}</h3>
              </div>
              <el-button text type="danger" @click="removeResearchCandidate(candidate)">목록에서 빼기</el-button>
            </div>
            <el-tag :type="candidate.relationType" effect="plain">{{ candidate.relation }}</el-tag>
            <p>{{ candidate.basis }}</p>
            <div class="research-candidate-card__actions">
              <el-link :href="getDartSearchUrl(candidate.companyName)" target="_blank" rel="noopener noreferrer" type="primary">
                DART 공시 확인 ↗
              </el-link>
              <el-link type="primary" @click="router.push({ name: 'case-study-detail', params: { id: candidate.caseId } })">
                사례 다시 보기 →
              </el-link>
            </div>
          </el-card>
        </div>
        <el-empty v-else :image-size="64" description="케이스 스터디에서 공부 목록에 담은 기업이 없습니다." />
      </section>

      <section v-if="writtenCaseNotes.length" class="analysis-section journal-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">MY JUDGMENT NOTES</p>
            <h2>나의 판단 노트</h2>
          </div>
          <el-tag type="success" effect="plain">{{ writtenCaseNotes.length }}개</el-tag>
        </div>

        <div class="journal-grid">
          <el-card
            v-for="{ study, note } in writtenCaseNotes"
            :key="study.id"
            class="journal-card"
            shadow="never"
          >
            <span>{{ study.region }} · {{ study.category }}</span>
            <h3>{{ study.title }}</h3>
            <div v-if="note.judgmentBasis" class="journal-card__item">
              <small>확인한 사실</small>
              <p>{{ note.judgmentBasis }}</p>
            </div>
            <div v-if="note.concerns" class="journal-card__item journal-card__item--caution">
              <small>보류·제외 조건</small>
              <p>{{ note.concerns }}</p>
            </div>
            <div v-if="note.nextChecks" class="journal-card__item">
              <small>다음 확인</small>
              <p>{{ note.nextChecks }}</p>
            </div>
            <el-link type="primary" @click="router.push({ name: 'case-study-detail', params: { id: study.id } })">
              판단 노트 이어 쓰기 →
            </el-link>
          </el-card>
        </div>
      </section>

      <section v-if="shortlistedStudies.length" class="analysis-section next-checks-section">
        <div class="section-heading">
          <div>
            <p class="section-eyebrow">NEXT CHECKS</p>
            <h2>오늘 확인할 것</h2>
          </div>
          <el-tag type="success" effect="plain">{{ researchCheckProgress.completed }}/{{ researchCheckProgress.total }} 완료</el-tag>
        </div>

        <el-card class="next-checks-card" shadow="never">
          <el-progress type="dashboard" :percentage="researchCheckProgress.percentage" :stroke-width="10">
            <template #default="{ percentage }"><strong>{{ percentage }}%</strong></template>
          </el-progress>
          <div class="next-checks-copy">
            <strong>공부 목록 {{ savedResearchCandidates.length }}개</strong>
            <p>아래 사례를 눌러 아직 체크하지 않은 항목을 확인하세요.</p>
            <div class="next-checks-buttons">
              <el-button
                v-for="study in shortlistedStudies"
                :key="study.id"
                type="primary"
                plain
                @click="router.push({ name: 'case-study-detail', params: { id: study.id } })"
              >
                {{ study.title }} 확인
              </el-button>
            </div>
          </div>
        </el-card>
      </section>
    </template>

    <el-dialog v-model="videoNoteDialogVisible" title="방송·유튜브 검증 기록" width="680px" destroy-on-close>
      <p class="dialog-description">방송의 추천을 그대로 따르지 않고, 내가 확인할 주장과 반대 근거를 남깁니다.</p>
      <el-form :model="videoNoteForm" label-position="top" class="memo-form">
        <div class="video-form-grid">
          <el-form-item label="방송·채널 이름">
            <el-input v-model="videoNoteForm.sourceName" maxlength="100" placeholder="예: ○○ 경제채널" />
          </el-form-item>
          <el-form-item label="시청 날짜">
            <el-date-picker v-model="videoNoteForm.watchedAt" type="date" value-format="YYYY-MM-DD" placeholder="날짜 선택" />
          </el-form-item>
        </div>
        <el-form-item label="언급된 기업">
          <el-input v-model="videoNoteForm.companyName" maxlength="80" placeholder="예: 삼성전자" />
        </el-form-item>
        <el-form-item label="현재 검토 상태">
          <el-radio-group v-model="videoNoteForm.reviewStatus">
            <el-radio-button label="기록만" />
            <el-radio-button label="공식 자료 확인 중" />
            <el-radio-button label="보류" />
            <el-radio-button label="검토 완료" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="영상 링크 (선택)">
          <el-input v-model="videoNoteForm.sourceUrl" maxlength="500" placeholder="유튜브 영상 주소를 붙여 넣으세요." />
        </el-form-item>
        <el-form-item label="방송에서 들은 핵심 주장">
          <el-input v-model="videoNoteForm.claim" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="왜 이 기업을 언급했는지 짧게 적으세요." />
        </el-form-item>
        <el-form-item label="내가 확인한 사실">
          <el-input v-model="videoNoteForm.verifiedFacts" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="공시·계약·정책 원문에서 직접 확인한 내용을 적으세요." />
        </el-form-item>
        <el-form-item label="보류·제외 조건">
          <el-input v-model="videoNoteForm.concerns" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="확인되지 않았거나 맞지 않는 조건을 적으세요." />
        </el-form-item>
        <el-form-item label="확인한 항목">
          <div class="verification-checks">
            <el-checkbox v-model="videoNoteForm.verificationChecks.disclosure">DART 공시 확인</el-checkbox>
            <el-checkbox v-model="videoNoteForm.verificationChecks.policy">정책·사업 원문 확인</el-checkbox>
            <el-checkbox v-model="videoNoteForm.verificationChecks.caseStudy">유사 사례 비교</el-checkbox>
            <el-checkbox v-model="videoNoteForm.verificationChecks.counterArgument">반대 근거 기록</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item label="연결해 볼 케이스 스터디 (선택)">
          <el-select v-model="videoNoteForm.linkedCaseId" clearable placeholder="비슷한 과거 사례 선택">
            <el-option v-for="study in CASE_STUDIES" :key="study.id" :label="study.title" :value="study.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="연결해 볼 지역 정책·사업 (선택)">
          <el-select v-model="videoNoteForm.linkedProjectId" clearable filterable placeholder="현재 지역 정책·사업 선택">
            <el-option
              v-for="project in dataStore.items"
              :key="project.id"
              :label="`${project.region} · ${project.projectName}`"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="다음에 확인할 것">
          <el-input v-model="videoNoteForm.nextChecks" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="다음 공시·실적·공식 자료에서 확인할 내용을 적으세요." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="videoNoteDialogVisible = false">취소</el-button>
        <el-button type="success" :disabled="!videoNoteForm.sourceName.trim() || !videoNoteForm.companyName.trim()" @click="saveVideoNote">검증 기록 저장</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="memoDialogVisible" title="개인 분석 메모" width="680px" destroy-on-close>
      <p class="dialog-description">저장한 정책·사업에 대한 공개자료 기반 개인 판단 기록입니다.</p>
      <el-form :model="memoForm" label-position="top" class="memo-form">
        <el-form-item label="관심 이유">
          <el-input
            v-model="memoForm.interestReason"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="이 정책·사업에 관심을 둔 이유를 적어보세요."
          />
        </el-form-item>
        <el-form-item label="투자 판단 근거">
          <el-input
            v-model="memoForm.judgmentBasis"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="공개자료를 바탕으로 정리한 개인 판단 근거를 적어보세요."
          />
        </el-form-item>
        <el-form-item label="기대하는 시나리오">
          <el-input
            v-model="memoForm.expectedScenario"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="앞으로 전개될 수 있다고 생각하는 시나리오를 적어보세요."
          />
        </el-form-item>
        <el-form-item label="우려되는 점">
          <el-input
            v-model="memoForm.concerns"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="확인되지 않은 부분이나 우려되는 점을 적어보세요."
          />
        </el-form-item>
        <el-form-item label="앞으로 확인할 정보">
          <el-input
            v-model="memoForm.nextChecks"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="다음에 확인할 공식 출처·공시·정책 자료를 적어보세요."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeMemoDialog">취소</el-button>
        <el-button type="primary" @click="saveMemo">메모 저장</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.my-analysis-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 56px 24px 88px;
}

.analysis-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 48px;
  border-radius: 28px;
  color: #fff;
  background:
    radial-gradient(circle at 90% 12%, rgb(45 212 191 / 28%), transparent 32%),
    linear-gradient(135deg, #172554 0%, #1e3a8a 56%, #0f766e 130%);
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
  color: #93c5fd;
}

.analysis-hero h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(2.3rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 1.1;
}

.hero-description {
  max-width: 650px;
  margin: 20px 0 0;
  color: #dbeafe;
  font-size: 1.04rem;
  line-height: 1.75;
}

.research-notice {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}

.research-notice p {
  margin: 0;
  color: #bfdbfe;
  font-size: 0.82rem;
  line-height: 1.6;
}

.analysis-summary {
  display: grid;
  flex: 0 0 230px;
  gap: 8px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 18px;
  color: #dbeafe;
  background: rgb(15 23 42 / 24%);
}

:deep(.analysis-summary .el-card__body) {
  display: grid;
  gap: 8px;
  padding: 22px;
}

.analysis-summary > span,
.analysis-summary > small {
  color: #bfdbfe;
  font-size: 0.76rem;
}

.analysis-summary strong {
  color: #fff;
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.08em;
  line-height: 1;
}

.analysis-summary strong small {
  margin-left: 4px;
  color: #bfdbfe;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
}

.empty-container {
  display: grid;
  min-height: 360px;
  margin-top: 34px;
  place-items: center;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
  background: #fff;
}

.analysis-section {
  margin-top: 54px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
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

.regions-card,
.company-card {
  border: 1px solid #e5eaf2;
  border-radius: 20px;
  background: #fff;
}

.region-list {
  display: grid;
  gap: 10px;
}

.region-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 13px;
  background: #f7f9fc;
}

.region-row > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.region-row span {
  color: #6b7890;
  font-size: 0.82rem;
}

.project-list {
  display: grid;
  gap: 20px;
}

.company-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.company-card :deep(.el-card__header) {
  padding: 20px 22px;
}

.company-card :deep(.el-card__body) {
  padding: 20px 22px 22px;
}

.company-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.company-header-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.company-card-header h3 {
  margin: 0 0 9px;
  color: #172033;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.industry-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.company-business {
  margin: 12px 0 0;
  color: #34445e;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.6;
}

.dart-business-summary {
  margin: 6px 0 0;
  color: #738097;
  font-size: 0.76rem;
  line-height: 1.55;
}

.company-details {
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
}

.company-details > div {
  display: grid;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #edf0f5;
}

dt,
.linked-projects > span,
.interest-heading span {
  color: #8a96aa;
  font-size: 0.72rem;
  font-weight: 800;
}

dd {
  margin: 0;
  color: #5f6d83;
  font-size: 0.82rem;
  line-height: 1.65;
}

.linked-projects {
  display: grid;
  gap: 7px;
  margin-top: 20px;
  padding: 14px;
  border-radius: 13px;
  background: #f7f9fc;
}

.linked-projects > div {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 8px;
}

.linked-projects :deep(.el-button) {
  height: auto;
  padding: 3px 0;
  text-align: left;
  white-space: normal;
}

.company-dart-links {
  display: grid;
  gap: 7px;
  margin-top: 18px;
  padding: 14px;
  border-radius: 13px;
  background: #f7f9fc;
}

.company-dart-links > span {
  color: #8a96aa;
  font-size: 0.72rem;
  font-weight: 800;
}

.dart-disclosure-list {
  display: grid;
  gap: 5px;
}

.company-dart-links small {
  color: #96a0b1;
  font-size: 0.7rem;
}

.company-interest-control {
  display: grid;
  gap: 10px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #edf0f5;
}

.interest-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.interest-heading strong {
  color: #2563eb;
  font-size: 0.9rem;
}

.interest-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.interest-input-row :deep(.el-input-number) {
  width: 130px;
}

.interest-input-row small {
  color: #96a0b1;
  font-size: 0.72rem;
  line-height: 1.5;
}

.company-link {
  margin-top: 18px;
  font-size: 0.8rem;
  font-weight: 700;
}

.research-candidates-section {
  margin-top: 54px;
}

.video-notes-section {
  margin-top: 54px;
}

.video-notes-intro {
  margin: -8px 0 18px;
  color: #64748b;
  font-size: 0.84rem;
}

.video-notes-header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.video-note-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 18px;
}

.video-review-queue {
  margin: 0 0 18px;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  background: #f0fdf4;
}

.video-review-queue :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
}

.video-review-queue > div:first-child {
  display: grid;
  gap: 4px;
}

.video-review-queue span {
  color: #166534;
  font-size: 0.82rem;
  font-weight: 800;
}

.video-review-queue small {
  color: #4b6b5a;
  font-size: 0.72rem;
}

.video-review-queue__items {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}

.video-note-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.video-note-card {
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  background: #fbfdff;
}

.video-note-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.video-note-card__head > div:first-child {
  display: grid;
  gap: 4px;
}

.video-note-card__head span {
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 800;
}

.video-note-card__head h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.08rem;
}

.video-note-card__head small {
  color: #94a3b8;
  font-size: 0.7rem;
}

.video-note-card__buttons {
  display: flex;
  gap: 2px;
}

.video-note-card__item {
  margin-top: 9px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f1f5f9;
}

.video-note-card__item--fact {
  background: #ecfdf5;
}

.video-note-card__item--caution {
  background: #fffbeb;
}

.video-note-card__item small {
  color: #64748b;
  font-size: 0.69rem;
  font-weight: 800;
}

.video-note-card__item p {
  margin: 5px 0 0;
  color: #334155;
  font-size: 0.8rem;
  line-height: 1.55;
  white-space: pre-wrap;
}

.video-note-card__progress {
  display: grid;
  gap: 7px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.video-note-card__progress span {
  color: #475569;
  font-size: 0.7rem;
  font-weight: 800;
}

.video-note-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
  padding-top: 13px;
  border-top: 1px solid #dbeafe;
}

.video-note-card__actions :deep(.el-link) {
  font-size: 0.76rem;
  font-weight: 800;
}

.journal-section {
  margin-top: 54px;
}

.journal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.journal-card {
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  background: #fafffc;
}

.journal-card > span {
  color: #15803d;
  font-size: 0.72rem;
  font-weight: 800;
}

.journal-card h3 {
  margin: 6px 0 16px;
  color: #1e293b;
  font-size: 1.04rem;
}

.journal-card__item {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f0fdf4;
}

.journal-card__item--caution {
  background: #fffbeb;
}

.journal-card__item small {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
}

.journal-card__item p {
  margin: 5px 0 0;
  color: #334155;
  font-size: 0.8rem;
  line-height: 1.55;
  white-space: pre-wrap;
}

.journal-card :deep(.el-link) {
  margin-top: 16px;
  font-size: 0.78rem;
  font-weight: 800;
}

.research-candidate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.research-candidate-card {
  border: 1px solid #fde68a;
  border-radius: 16px;
  background: #fffdf7;
}

.research-candidate-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.research-candidate-card__head span {
  color: #a16207;
  font-size: 0.72rem;
  font-weight: 800;
}

.research-candidate-card__head h3 {
  margin: 5px 0 0;
  color: #1e293b;
  font-size: 1.04rem;
}

.research-candidate-card p {
  min-height: 3.4em;
  margin: 13px 0;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.6;
}

.research-candidate-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 13px;
  border-top: 1px solid #fef3c7;
}

.research-candidate-card__actions :deep(.el-link) {
  font-size: 0.76rem;
  font-weight: 800;
}

.next-checks-section {
  margin-top: 54px;
}

.next-checks-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 26px;
}

.next-checks-card :deep(.el-progress__text strong) {
  color: #2563eb;
  font-size: 1.2rem;
}

.next-checks-copy {
  display: grid;
  gap: 8px;
}

.next-checks-copy > strong {
  color: #1e293b;
  font-size: 1.05rem;
}

.next-checks-copy p {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
}

.next-checks-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.dialog-description {
  margin: 0 0 18px;
  color: #6b7890;
  font-size: 0.86rem;
  line-height: 1.6;
}

.memo-form {
  display: grid;
  gap: 2px;
}

.memo-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.video-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.video-form-grid :deep(.el-form-item) {
  min-width: 0;
}

.video-form-grid :deep(.el-date-editor),
.memo-form :deep(.el-select) {
  width: 100%;
}

.memo-form :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.memo-form :deep(.el-radio-button__inner) {
  border-radius: 8px !important;
  box-shadow: none !important;
  font-size: 0.78rem;
}

.verification-checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.verification-checks :deep(.el-checkbox) {
  margin-right: 0;
  color: #475569;
  font-size: 0.8rem;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 900px) {
  .analysis-hero {
    align-items: stretch;
    display: grid;
    padding: 34px 28px;
  }

  .analysis-summary {
    width: 100%;
  }

  .company-grid {
    grid-template-columns: 1fr;
  }

  .research-candidate-grid {
    grid-template-columns: 1fr;
  }

  .video-note-grid {
    grid-template-columns: 1fr;
  }

  .video-review-queue :deep(.el-card__body) {
    align-items: flex-start;
    display: grid;
  }

  .video-review-queue__items {
    justify-content: flex-start;
  }

  .journal-grid {
    grid-template-columns: 1fr;
  }

  .next-checks-card :deep(.el-card__body) {
    align-items: flex-start;
    display: grid;
  }
}

@media (max-width: 680px) {
  .my-analysis-page {
    padding: 32px 18px 60px;
  }

  .analysis-hero {
    padding: 28px 22px;
    border-radius: 22px;
  }

  .section-heading {
    align-items: flex-start;
    display: grid;
  }

  .region-row,
  .interest-input-row {
    align-items: flex-start;
    display: grid;
  }

  .interest-input-row :deep(.el-input-number) {
    width: 100%;
  }

  .video-form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .verification-checks {
    grid-template-columns: 1fr;
  }
}
</style>
