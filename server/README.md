# 공개 API 프록시

이 서버는 지방재정365 세부사업별 세출현황 API, 국회 의안정보 API, 금융감독원 OpenDART API의 인증키를 브라우저에 전달하지 않고 `/api` 경로로 공개자료를 중계합니다.

## 로컬 실행 순서

1. `.env.example`을 참고해 `.env.local`에 서버 환경변수를 작성합니다.
2. `VITE_API_ENABLED=true`로 설정합니다.
3. `npm run api`로 API 서버를 실행합니다.
4. 별도 터미널에서 `npm run dev`를 실행합니다.

지방재정365 세부사업별 세출현황은 `LOFIN_EXPENDITURE_API_KEY`만 `.env.local`에 입력합니다. API 주소와 `Key`, `Type`, `pIndex`, `pSize`, `fyr`, `exe_ymd` 요청값은 서버가 처리하며, 인증키는 Vue 번들에 포함되지 않습니다. 조회 기준은 필요하면 `LOFIN_EXPENDITURE_YEAR`, `LOFIN_EXPENDITURE_DATE`로 지정합니다.

국회 의안정보 API는 공공데이터포털의 「국회 국회사무처_의안정보 통합 API」 활용신청 후 연결된 공식 XML API URL을 `ASSEMBLY_BILL_API_URL`에 입력합니다. 서비스키는 `ASSEMBLY_BILL_API_KEY`에만 입력하고 `ASSEMBLY_BILL_KEY_PARAM`은 해당 API 가이드의 키 파라미터 이름에 맞춥니다. 국회 API 응답은 서버에서 XML을 변환한 뒤 브라우저에 전달합니다.

원천 응답은 `src/services/api/normalizers.js`의 변환 함수에서 기존 지역산업 카드 구조로 매핑합니다. API 키·URL이 없거나 응답이 비어 있거나 원천 API가 실패하면 프론트엔드는 기존 샘플 데이터로 대체합니다.

법안 응답은 `src/services/api/legislationMappers.js`에서 법안 카드 구조로 변환합니다. 국회 API 키·URL이 없거나 응답이 비어 있거나 원천 API가 실패하면 법안 샘플 데이터로 대체합니다.

DART 기업정보는 `DART_API_KEY`를 서버 환경변수로만 읽습니다. `.env.local`에 키를 입력한 뒤 API 서버를 재시작하면 `/api/dart/companies`가 DART 기업개황과 최근 공시 목록을 반환합니다. 기업 고유번호 매핑은 `server/providers/dartCompanyRegistry.js`에서 관리하며, 기업 연결 상태와 지역·사업 연결 근거는 기존 샘플·공개자료 메타데이터를 유지합니다.

DART 응답은 `src/services/api/dartMappers.js`에서 기존 기업 구조로 변환합니다. DART 공시 접수번호로 만든 공식 원문 링크와 확인 날짜를 함께 표시하며, 키가 없거나 API가 실패하거나 일부 기업 응답이 없으면 기존 샘플 기업을 유지합니다.
