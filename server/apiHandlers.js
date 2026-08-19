import { fetchAssemblyBillPayload } from './providers/assemblyBillProvider.js'
import { fetchDartCompanyPayload } from './providers/dartProvider.js'
import { fetchRegionalIndustryPayload } from './providers/regionalIndustryProvider.js'
import { fetchStockPricePayload } from './providers/stockPriceProvider.js'
import { getProviderStatus } from './providers/providerRegistry.js'

function logProviderFailure(provider, error) {
  // Provider errors are intentionally reduced to a code so that keys and upstream payloads
  // never enter local or Vercel logs.
  console.error(`[${provider}]`, error?.code ?? 'UNKNOWN')
}

function providerFailure(provider, error, messages) {
  const isConfigurationError = error?.code === 'CONFIGURATION'
  const isNoDataError = error?.code === 'NO_DATA'
  logProviderFailure(provider, error)

  return {
    statusCode: isConfigurationError ? 503 : 502,
    payload: {
      error: isConfigurationError ? 'API_NOT_CONFIGURED' : 'UPSTREAM_API_ERROR',
      message:
        isConfigurationError || isNoDataError
          ? messages.configuration
          : messages.upstream,
    },
  }
}

export async function resolveApiRequest(pathname, searchParams = new URLSearchParams()) {
  if (pathname === '/api/health') {
    return {
      statusCode: 200,
      payload: {
        status: 'ok',
        providers: getProviderStatus(),
      },
    }
  }

  if (pathname === '/api/regional-industry/items') {
    try {
      const payload = await fetchRegionalIndustryPayload()
      return {
        statusCode: 200,
        payload: { ...payload, dataOrigin: 'live' },
      }
    } catch (error) {
      return providerFailure('regional-industry-api', error, {
        configuration: 'API 연결 설정이 없어 샘플 데이터로 대체합니다.',
        upstream: '공개 API를 불러오지 못해 샘플 데이터로 대체합니다.',
      })
    }
  }

  if (pathname === '/api/legislation/bills') {
    try {
      const payload = await fetchAssemblyBillPayload()
      return {
        statusCode: 200,
        payload: { ...payload, dataOrigin: 'live' },
      }
    } catch (error) {
      return providerFailure('legislation-api', error, {
        configuration: '국회 의안정보 API 연결 설정이 없어 샘플 데이터로 대체합니다.',
        upstream: '국회 의안정보 API를 불러오지 못해 샘플 데이터로 대체합니다.',
      })
    }
  }

  if (pathname === '/api/dart/companies') {
    try {
      const payload = await fetchDartCompanyPayload()
      return {
        statusCode: 200,
        payload: { ...payload, dataOrigin: 'live' },
      }
    } catch (error) {
      return providerFailure('dart-api', error, {
        configuration: 'DART API 설정 또는 기업 응답이 없어 기존 샘플 기업 데이터를 표시합니다.',
        upstream: 'DART API를 불러오지 못해 기존 샘플 기업 데이터를 표시합니다.',
      })
    }
  }

  if (pathname === '/api/stocks/prices') {
    try {
      const stockCode = String(searchParams.get('stockCode') ?? '005930')
      if (!/^\d{6}$/.test(stockCode)) {
        return {
          statusCode: 400,
          payload: { error: 'INVALID_STOCK_CODE', message: '6자리 종목코드가 필요합니다.' },
        }
      }
      const payload = await fetchStockPricePayload({ stockCode })
      return { statusCode: 200, payload: { ...payload, dataOrigin: 'live' } }
    } catch (error) {
      return providerFailure('stock-price-api', error, {
        configuration: '주식시세 API 연결 설정이 없어 샘플 데이터를 표시합니다.',
        upstream: '주식시세 API를 불러오지 못했습니다.',
      })
    }
  }

  return {
    statusCode: 404,
    payload: { error: 'NOT_FOUND', message: '요청한 API 경로가 없습니다.' },
  }
}
