import { CASE_STUDIES } from '../src/data/caseStudies.js'

const requiredMarketFields = [
  'close',
  'return5',
  'return20',
  'marketReturn5',
  'marketReturn20',
]

const errors = []

function requireValue(value, message) {
  if (value === undefined || value === null || value === '') errors.push(message)
}

if (CASE_STUDIES.length < 30) {
  errors.push(`사례 수가 ${CASE_STUDIES.length}건입니다. 기초 데이터셋은 최소 30건이어야 합니다.`)
}

CASE_STUDIES.forEach((study) => {
  const label = `[${study.id || study.title || 'unknown'}]`
  ;['id', 'title', 'type', 'region', 'category', 'summary', 'status', 'researchQuestion'].forEach((field) =>
    requireValue(study[field], `${label} ${field} 값이 없습니다.`),
  )

  if (!Array.isArray(study.events) || !study.events.length) {
    errors.push(`${label} 공식 정책 이벤트가 없습니다.`)
  }

  study.events?.forEach((event, index) => {
    const eventLabel = `${label} 이벤트 ${index + 1}`
    ;['date', 'stage', 'title', 'sourceUrl'].forEach((field) =>
      requireValue(event[field], `${eventLabel} ${field} 값이 없습니다.`),
    )

    if (event.market) {
      requiredMarketFields.forEach((field) =>
        requireValue(event.market[field], `${eventLabel} 시장 관찰값 ${field} 값이 없습니다.`),
      )
    }
  })

  study.companies?.forEach((company, index) => {
    const companyLabel = `${label} 기업 ${index + 1}`
    ;['name', 'code', 'relation', 'basis'].forEach((field) =>
      requireValue(company[field], `${companyLabel} ${field} 값이 없습니다.`),
    )
  })

  if (study.market) {
    if (!study.companies?.length) errors.push(`${label} 시장 반응 자료에 연결 기업이 없습니다.`)
    ;['companyName', 'stockCode', 'sourceUrl', 'benchmarkUrl', 'verifiedAt', 'note'].forEach((field) =>
      requireValue(study.market[field], `${label} 시장 자료 ${field} 값이 없습니다.`),
    )
    if (!study.events?.some((event) => event.market)) {
      errors.push(`${label} 시장 자료는 있지만 이벤트별 관찰값이 없습니다.`)
    }
  }
})

if (errors.length) {
  console.error(`케이스 스터디 검증 실패 (${errors.length}건)`)
  errors.forEach((error) => console.error(`- ${error}`))
  globalThis.process.exit(1)
}

const marketStudies = CASE_STUDIES.filter((study) => study.market).length
const marketEvents = CASE_STUDIES.flatMap((study) => study.events).filter((event) => event.market).length
console.log(`케이스 스터디 검증 완료: ${CASE_STUDIES.length}개 사례 · ${marketStudies}개 시장 관찰 사례 · ${marketEvents}개 이벤트 관찰값`)
