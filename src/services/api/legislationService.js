import axios from 'axios'

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
const legislationApiFlag = import.meta.env.VITE_LEGISLATION_API_ENABLED

// 국회 의안 API는 별도의 URL·서비스키가 있어야 하므로, 명시적으로 켠 경우에만 호출합니다.
// 미설정 상태에서 불필요한 실패 알림을 띄우지 않고 샘플 자료임을 분명히 보여줍니다.
export const isLegislationApiEnabled = legislationApiFlag === 'true'

const legislationClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 10000,
})

export async function fetchLegislationSnapshot() {
  try {
    const response = await legislationClient.get('/legislation/bills')
    return response.data
  } catch (error) {
    const status = error.response?.status
    const message = error.response?.data?.message

    throw new Error(message ?? `법안 API 요청에 실패했습니다.${status ? ` (${status})` : ''}`, {
      cause: error,
    })
  }
}
