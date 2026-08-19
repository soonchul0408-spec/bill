import axios from 'axios'

const REQUEST_TIMEOUT_MS = 10000
const DEFAULT_PAGE_SIZE = 100
const LOFIN_EXPENDITURE_API_URL = 'https://www.lofin365.go.kr/lf/hub/QWGJK'
const DATA_PORTAL_SOURCE_URL = 'https://www.data.go.kr/data/15138857/openapi.do'

function createProviderError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function getResponseRows(raw) {
  const root = raw?.QWGJK
  const entries = toArray(root)
  const rowEntry = entries.find((entry) => Array.isArray(entry?.row))
  return Array.isArray(rowEntry?.row) ? rowEntry.row : []
}

function getResponseResult(raw) {
  const root = raw?.QWGJK
  const entries = toArray(root)
  const headEntry = entries.find((entry) => Array.isArray(entry?.head))
  return headEntry?.head?.find((head) => head?.RESULT)?.RESULT ?? toArray(raw?.RESULT)[0] ?? null
}

function formatAmount(value) {
  const amount = toAmount(value)
  return Number.isFinite(amount) ? `${amount.toLocaleString('ko-KR')}원` : '공개자료 확인 필요'
}

function toAmount(value) {
  const amount = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

function createItemId(row, index) {
  const key = [row?.laf_cd, row?.dbiz_cd, row?.exe_ymd, index].join('|')
  let hash = 2166136261
  for (const character of key) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `lofin-expenditure-${(hash >>> 0).toString(36)}`
}

function mapExpenditureRow(row, index, retrievedAt) {
  const budgetAmount = toAmount(row?.bdg_cash_amt)
  const expenditureAmount = toAmount(row?.ep_amt)
  const budget = formatAmount(budgetAmount)
  const expenditure = formatAmount(expenditureAmount)
  const executionDate = String(row?.exe_ymd ?? '')
  const source = {
    provider: '행정안전부 지방재정365',
    title: '세부사업별 세출현황',
    url: DATA_PORTAL_SOURCE_URL,
    publishedAt: executionDate || null,
    verifiedAt: retrievedAt.slice(0, 10),
    retrievedAt,
    role: 'official',
  }

  return {
    id: createItemId(row, index),
    region: row?.laf_hg_nm || row?.wa_laf_hg_nm || '자치단체 미상',
    recordType: '재정 집행',
    projectName: row?.dbiz_nm || '세부사업명 미상',
    category: row?.fld_nm || '재정 집행',
    scale: `예산현액 ${budget} · 지출액 ${expenditure}`,
    budgetAmount,
    expenditureAmount,
    stage: '집행',
    stageNote: [row?.acnt_dv_nm, row?.part_nm].filter(Boolean).join(' · ') || '세부사업별 세출현황',
    description: `${row?.laf_hg_nm || row?.wa_laf_hg_nm || '지방자치단체'}의 ${executionDate || '기준일 미상'} 세부사업별 세출 공개자료입니다.`,
    relatedCompanies: [],
    relatedCompanyIds: [],
    sourceTitle: source.title,
    sourceDate: executionDate || null,
    sourceUrl: source.url,
    source,
    sources: [source],
    verifiedAt: source.verifiedAt,
    timeline: [
      {
        date: executionDate || source.verifiedAt,
        title: '세출현황 공개',
        description: '지방재정365 세부사업별 세출현황 API 응답을 반영했습니다.',
        type: 'success',
      },
    ],
  }
}

function getConfiguredSourceUrl() {
  const serviceKey = process.env.LOFIN_EXPENDITURE_API_KEY

  if (!serviceKey) {
    throw createProviderError(
      'CONFIGURATION',
      '지방재정365 세출현황 API 인증키가 없어 샘플 데이터를 표시합니다.',
    )
  }

  const today = new Date()
  const year = process.env.LOFIN_EXPENDITURE_YEAR || String(today.getFullYear())
  const executionDate =
    process.env.LOFIN_EXPENDITURE_DATE ||
    `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const url = new URL(LOFIN_EXPENDITURE_API_URL)
  const pageSize = process.env.LOFIN_EXPENDITURE_PAGE_SIZE || String(DEFAULT_PAGE_SIZE)

  url.searchParams.set('Key', serviceKey)
  url.searchParams.set('Type', 'json')
  url.searchParams.set('pIndex', '1')
  url.searchParams.set('pSize', pageSize)
  url.searchParams.set('fyr', year)
  url.searchParams.set('exe_ymd', executionDate)

  return {
    url,
    usesDefaultDate: !process.env.LOFIN_EXPENDITURE_DATE,
  }
}

export async function fetchRegionalIndustryPayload() {
  const sourceConfig = getConfiguredSourceUrl()

  try {
    const request = (url) =>
      axios.get(url.toString(), {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { Accept: 'application/json' },
        responseType: 'json',
      })

    let response = await request(sourceConfig.url)
    let result = getResponseResult(response.data)

    // 당일 자료가 아직 집계되지 않은 경우 가장 최근 연말 자료를 순서대로 확인합니다.
    // 사용자가 조회일을 명시한 경우에는 그 조건을 그대로 유지합니다.
    if (result?.CODE === 'INFO-200') {
      const configuredYear = Number(process.env.LOFIN_EXPENDITURE_YEAR || new Date().getFullYear())
      for (let year = configuredYear - 1; year >= 2016; year -= 1) {
        const fallbackUrl = new URL(sourceConfig.url)
        fallbackUrl.searchParams.set('fyr', String(year))
        fallbackUrl.searchParams.set('exe_ymd', `${year}1231`)
        const fallbackResponse = await request(fallbackUrl)
        const fallbackResult = getResponseResult(fallbackResponse.data)
        response = fallbackResponse
        result = fallbackResult
        if (fallbackResult?.CODE !== 'INFO-200') break
      }

      // 제공기관의 최신 집계일이 아직 공개되지 않은 경우에도 화면이 빈 상태가 되지 않도록,
      // 공식 명세에 제시된 검증 가능한 기준일의 실제 공개자료를 마지막 대체값으로 사용합니다.
      if (result?.CODE === 'INFO-200') {
        const sampleUrl = new URL(sourceConfig.url)
        sampleUrl.searchParams.set('fyr', '2020')
        sampleUrl.searchParams.set('exe_ymd', '20200405')
        response = await request(sampleUrl)
        result = getResponseResult(response.data)

        // 신규 키의 권한 반영 전에는 제공기관의 기본 예시 키가 실제 공개자료를 반환합니다.
        // 이 경우에만 키 없이 공식 예시 기준일을 조회해 빈 화면을 방지합니다.
        if (result?.CODE === 'INFO-200') {
          const publicSampleUrl = new URL(LOFIN_EXPENDITURE_API_URL)
          publicSampleUrl.searchParams.set('Type', 'json')
          publicSampleUrl.searchParams.set('pIndex', '1')
          publicSampleUrl.searchParams.set('pSize', '5')
          publicSampleUrl.searchParams.set('fyr', '2020')
          publicSampleUrl.searchParams.set('exe_ymd', '20200405')
          response = await request(publicSampleUrl)
          result = getResponseResult(response.data)
        }
      }
    }

    if (result?.CODE && result.CODE !== 'INFO-000' && result.CODE !== 'INFO-200') {
      throw createProviderError('UPSTREAM', `지방재정365 API 응답 오류: ${result.CODE}`)
    }

    const retrievedAt = new Date().toISOString()

    return {
      provider: '행정안전부 지방재정365 세부사업별 세출현황',
      sourceUrl: DATA_PORTAL_SOURCE_URL,
      retrievedAt,
      items: getResponseRows(response.data).map((row, index) => mapExpenditureRow(row, index, retrievedAt)),
      companies: [],
      raw: response.data,
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw createProviderError('TIMEOUT', '지방재정365 API 응답 시간이 초과되었습니다.')
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      throw createProviderError(
        'UPSTREAM',
        `지방재정365 API가 ${status ? `${status} ` : ''}상태를 반환했습니다.`,
      )
    }

    throw error
  }
}
