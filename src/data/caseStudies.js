function createPolicyOnlyStudy({ id, title, type, region, category, date, stage, eventTitle, sourceUrl, sourceName, companies = [], marketData = null }) {
  const hasCompanyBasis = companies.length > 0
  return {
    id,
    title,
    type,
    region,
    category,
    summary: hasCompanyBasis
      ? '공식 자료에서 지역 내 기업 입지·투자 또는 앵커 역할을 확인한 사례입니다. 개별 공시와 가격 반응은 별도로 검증합니다.'
      : '공식 지정·발표까지는 확인됐지만, 개별 상장기업의 참여 계약·공시가 확인되기 전 단계의 기준 사례입니다.',
    status: hasCompanyBasis ? '기업 근거 확인' : '대조·기초 분석',
    statusType: hasCompanyBasis ? 'warning' : 'info',
    researchQuestion: hasCompanyBasis
      ? '기업의 지역 입지·투자 근거가 실제 계약·공시와 가격 반응으로 이어지는가?'
      : '정책 지정 사실과 특정 상장기업의 매출·계약 연결을 분리해 확인할 수 있는가?',
    priceStatus: '직접 참여 기업 확인 전 차트 제외',
    ...(marketData ? {
      priceStatus: '실제 종가 기준 이벤트 반응',
      market: {
        companyName: companies[0].name,
        stockCode: companies[0].code,
        sourceTitle: '네이버페이 증권 일별 시세',
        sourceUrl: `https://finance.naver.com/item/sise_day.nhn?code=${companies[0].code}`,
        benchmarkTitle: 'KOSPI 일별 시세',
        benchmarkUrl: 'https://finance.naver.com/sise/sise_index.naver?code=KOSPI',
        verifiedAt: '2026.08.18',
        note: '일별 종가와 KOSPI의 단순 비교입니다. 정책 이외의 업황·실적·시장 요인을 분리한 인과 분석은 아닙니다.',
      },
    } : {}),
    signals: [
      { label: '직접성', icon: hasCompanyBasis ? '✓' : '!', level: hasCompanyBasis ? '근거 확인' : '낮음', type: hasCompanyBasis ? 'warning' : 'danger', value: hasCompanyBasis ? 64 : 14, detail: hasCompanyBasis ? '지역 투자·입지 근거 확인' : '개별 계약·공시 미확인' },
      { label: '사업 단계', icon: '↗', level: '확인', type: 'success', value: 72, detail: `${stage} 공식 자료 확인` },
      { label: '시장·업황', icon: '≈', level: '후속 확인', type: 'warning', value: 24, detail: '산업지수·실적 분리 필요' },
      { label: '공시·실적', icon: '⌕', level: '대기', type: 'info', value: 18, detail: '기업 투자·수주 공시 확인 전' },
      { label: '거래 반응', icon: '▥', level: '제외', type: 'info', value: 0, detail: '테마성 후보 생성을 차단' },
    ],
    companies,
    events: [{ date, stage, title: eventTitle, sourceUrl, sourceName, ...(marketData ? { market: marketData } : {}) }],
  }
}

const NATIONAL_COMPLEX_CANDIDATES = [
  ['daejeon-nano-space', '대전 나노·반도체·항공우주 국가산업단지 후보지', '대전광역시', '반도체', [{ name: '한화에어로스페이스', code: '012450', relation: '지역 항공우주 R&D·생산 거점', relationType: 'warning', basis: '한화에어로스페이스는 대전 R&D 캠퍼스와 사업장에서 우주발사체·추진기관 및 유도무기 관련 개발·생산을 공개합니다. 국가산단 후보지 사업의 입주·투자협약은 별도 확인이 필요합니다.', sourceUrl: 'https://m.hanwhaaerospace.com/kor/whoweare/location/domestic.do' }], { close: 101152, return5: -8.46, return20: 13.39, marketReturn5: 1.57, marketReturn20: 7.18 }],
  ['cheonan-mobility-chip', '천안 미래모빌리티·반도체 국가산업단지 후보지', '충청남도 천안시', '미래차'],
  ['cheongju-osong-rail', '청주 오송 철도 국가산업단지 후보지', '충청북도 청주시', '철도'],
  ['hongseong-hydrogen-mobility', '홍성 수소·미래차·이차전지 국가산업단지 후보지', '충청남도 홍성군', '수소·미래차'],
  ['gwangju-future-car', '광주 미래차 국가산업단지 후보지', '광주광역시', '미래차', [{ name: '기아', code: '000270', relation: '지역 완성차 생산거점', relationType: 'warning', basis: '기아는 AutoLand 광주를 완성차 생산 공장으로 공개합니다. 국가산단 후보지 사업의 직접 입주·투자 계약은 별도 확인이 필요합니다.', sourceUrl: 'https://www.kia.com/kr/discover-kia/workplace' }], { close: 79600, return5: -0.88, return20: 8.17, marketReturn5: 1.57, marketReturn20: 7.18 }],
  ['goheung-space', '고흥 우주산업 국가산업단지 후보지', '전라남도 고흥군', '우주'],
  ['iksan-food-tech', '익산 푸드테크 국가산업단지 후보지', '전북특별자치도 익산시', '푸드테크'],
  ['wanju-hydrogen', '완주 수소저장·활용 국가산업단지 후보지', '전북특별자치도 완주군', '수소'],
  ['changwon-defense-nuclear', '창원 방위·원자력 국가산업단지 후보지', '경상남도 창원시', '방산·원전', [{ name: '두산에너빌리티', code: '034020', relation: '지역 원전·SMR 생산거점', relationType: 'warning', basis: '두산에너빌리티는 창원공장을 원자력·발전 설비 관련 사업장으로 공개합니다. 국가산단 후보지 사업의 직접 계약·매출 연결은 별도 확인이 필요합니다.', sourceUrl: 'https://www.doosanenerbility.com/heavy_file/about/data/certification/iso/ISO45001_RA_S_2022_Kor.pdf' }], { close: 17690, return5: -6.67, return20: 0.06, marketReturn5: 1.57, marketReturn20: 7.18 }],
  ['daegu-mobility-robot', '대구 미래차·로봇 국가산업단지 후보지', '대구광역시', '미래차·로봇'],
  ['andong-biopharma', '안동 바이오의약 국가산업단지 후보지', '경상북도 안동시', '바이오'],
  ['gyeongju-smr', '경주 SMR 국가산업단지 후보지', '경상북도 경주시', '원전'],
  ['uljin-nuclear-hydrogen', '울진 원전연계 수소생산 국가산업단지 후보지', '경상북도 울진군', '수소'],
  ['gangneung-natural-bio', '강릉 천연물 바이오 국가산업단지 후보지', '강원특별자치도 강릉시', '바이오'],
].map(([id, title, region, category, companies, marketData]) => createPolicyOnlyStudy({
  id, title, region, category, type: '국가산업단지 후보지', date: '2023.03.15', stage: '후보지 발표',
  eventTitle: '국가첨단산업단지 후보지 발표', sourceUrl: 'https://www.korea.kr/news/policyNewsView.do?newsId=148912765',
  companies, marketData,
}))

const BIO_COMPLEX_CANDIDATES = [
  ['incheon-siheung-bio', '인천·경기 시흥 바이오 국가첨단전략산업 특화단지', '인천광역시·경기도 시흥시', [{ name: '삼성바이오로직스', code: '207940', relation: '정부 선도기업', relationType: 'warning', basis: '국무조정실의 특화단지 지정 자료는 삼성바이오로직스를 인천·시흥 바이오 특화단지의 주요 선도기업으로 명시합니다.', sourceUrl: 'https://www.opm.go.kr/opm/news/press1.do?articleNo=157208&attachNo=143318&mode=download' }], { close: 1077316, return5: 9.7, return20: 18.99, marketReturn5: 1.47, marketReturn20: -2.64, volumeRatio: 0.9 }],
  ['daejeon-yuseong-bio', '대전 유성 바이오 국가첨단전략산업 특화단지', '대전광역시 유성구', [{ name: '알테오젠', code: '196170', relation: '정부 선도기업', relationType: 'warning', basis: '국무조정실의 특화단지 지정 자료는 알테오젠을 대전 유성 바이오 특화단지의 주요 선도기업으로 명시합니다.', sourceUrl: 'https://www.opm.go.kr/opm/news/press1.do?articleNo=157208&attachNo=143318&mode=download' }], { close: 218909, return5: -9.67, return20: -3.16, marketReturn5: 1.47, marketReturn20: -2.64, volumeRatio: 0.79 }],
  ['gangwon-chuncheon-hongcheon-bio', '강원 춘천·홍천 바이오 국가첨단전략산업 특화단지', '강원특별자치도 춘천·홍천군', [{ name: '유바이오로직스', code: '206650', relation: '특화단지 유치 투자협약', relationType: 'warning', basis: '강원도·춘천시·유바이오로직스는 특화단지 유치를 위한 투자협약을 공개했습니다. 특화단지 지정 후의 개별 매출·수주 영향은 별도 확인이 필요합니다.', sourceUrl: 'https://ombudsman.kotra.or.kr/gwn-kr/bbs/i-873/detail.do?ntt_sn=491535' }], { close: 12000, return5: 0.67, return20: -6.67, marketReturn5: 1.47, marketReturn20: -2.64 }],
  ['jeonnam-hwasun-bio', '전남 화순 바이오 국가첨단전략산업 특화단지', '전라남도 화순군', [{ name: 'GC녹십자', code: '006280', relation: '지역 백신 생산거점', relationType: 'warning', basis: 'GC녹십자의 지속가능경영보고서는 화순공장을 회사의 완제의약품 제조소로 명시합니다. 특화단지 지정 자체가 개별 투자·수주를 의미하지는 않습니다.', sourceUrl: 'https://gcbiopharma.com/kor/images/down/GC_Sustainability_Report_2024_kor.pdf' }], { close: 113600, return5: 2.99, return20: 12.32, marketReturn5: 1.47, marketReturn20: -2.64 }],
  ['gyeongbuk-andong-pohang-bio', '경북 안동·포항 바이오 국가첨단전략산업 특화단지', '경상북도 안동·포항시', [{ name: 'SK바이오사이언스', code: '302440', relation: '지역 협력기업', relationType: 'warning', basis: 'SK바이오사이언스와 안동시는 국가첨단백신개발센터·바이오 특화단지 지정을 위한 협력 MOU를 공개했습니다. 특화단지의 개별 투자·수주 공시는 별도 확인이 필요합니다.', sourceUrl: 'https://www.skbioscience.com/kr/news/news_03_01?id=152&mode=2' }], { close: 53300, return5: -2.44, return20: 0, marketReturn5: 1.47, marketReturn20: -2.64, volumeRatio: 17.92 }],
].map(([id, title, region, companies, marketData]) => createPolicyOnlyStudy({
  id, title, region, category: '바이오', type: '국가 특화단지', date: '2024.06.27', stage: '특화단지 지정',
  eventTitle: '바이오 국가첨단전략산업 특화단지 지정', sourceUrl: 'https://gonggam.korea.kr/newsContentView.es?code_cd=0107000000&content=NC002&mid=a12700000000&news_id=c401af0c-dc13-43ad-bd14-6e3531893e9b&section_id=NCCD_POLICY',
  companies, marketData,
}))

const DEFENSE_CLUSTER_CANDIDATE = createPolicyOnlyStudy({
  id: 'changwon-defense-innovation-cluster', title: '경남·창원 방산혁신클러스터 시범사업', type: '지자체·방산 협력사업',
  region: '경상남도 창원시', category: '방산', date: '2020.06.18', stage: '업무협약',
  eventTitle: '경남·창원 방산혁신클러스터 시범사업 업무협약', sourceUrl: 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156396254',
  companies: [{ name: '한화에어로스페이스', code: '012450', relation: '지역 방산 생산거점', relationType: 'warning', basis: '한화에어로스페이스는 창원 사업장에서 기동·발사·대공 등 방산 체계를 생산한다고 공개합니다. 시범사업이 회사의 개별 계약·매출로 연결됐는지는 별도 확인이 필요합니다.', sourceUrl: 'https://m.hanwhaaerospace.com/kor/whoweare/location/domestic.do' }],
  marketData: { close: 29744, return5: -17.47, return20: -18.32, marketReturn5: -0.99, marketReturn20: 3.17 },
})

const CASE_STUDIES = [
  {
    id: 'yongin-semiconductor',
    title: '용인 첨단시스템반도체 국가산업단지',
    type: '국가산단·기업 협약',
    region: '경기도 용인시',
    category: '반도체',
    summary:
      '국가 첨단산업 육성전략 발표부터 입주협약과 산업단지계획 승인까지 이어진 사례입니다. 사업 단계별 공개 근거와 기업 연결을 함께 검토합니다.',
    status: '직접 연결 사례',
    statusType: 'success',
    researchQuestion: '정책 발표 이후 입주협약·산단 승인 같은 후속 단계가 실제 기업 참여 근거를 얼마나 강화하는가?',
    priceStatus: '실제 종가 기준 이벤트 반응',
    market: {
      companyName: '삼성전자',
      stockCode: '005930',
      sourceTitle: '네이버페이 증권 일별 시세',
      sourceUrl: 'https://finance.naver.com/item/sise_day.nhn?code=005930',
      benchmarkTitle: 'KOSPI 일별 시세',
      benchmarkUrl: 'https://finance.naver.com/sise/sise_index.naver?code=KOSPI',
      verifiedAt: '2026.08.18',
      note: '수정주가가 아닌 일별 종가입니다. KOSPI 대비는 시장 전체와의 단순 비교이며 업황·실적 등 다른 요인의 영향을 분리하지 않은 관찰값입니다.',
    },
    signals: [
      { label: '직접성', icon: '✓', level: '높음', type: 'success', value: 92, detail: '입주·실시협약 확인' },
      { label: '사업 단계', icon: '↗', level: '높음', type: 'success', value: 84, detail: '발표 → 협약 → 승인' },
      { label: '시장·업황', icon: '≈', level: '분리 확인', type: 'warning', value: 48, detail: '반도체 업황·KOSPI 비교 필요' },
      { label: '공시·실적', icon: '⌕', level: '추가 확인', type: 'info', value: 56, detail: 'DART 투자·수주 공시 확인' },
      { label: '거래 반응', icon: '▥', level: '보통', type: 'info', value: 58, detail: '거래량·가격 범위 함께 확인' },
    ],
    companies: [
      {
        name: '삼성전자',
        code: '005930',
        relation: '직접 참여',
        relationType: 'success',
        basis: '국토교통부·경기도·용인시·LH와 기본 및 입주협약, 이후 실시협약에 참여한 입주기업입니다.',
      },
    ],
    events: [
      {
        date: '2023.03.15',
        stage: '정책 발표',
        title: '국가첨단산업 육성전략 발표',
        sourceUrl:
          'https://www.yongin.go.kr/home/www/www19/www19_02_01/www19_02_01_01.jsp',
        market: { close: 59800, volume: 10482149, return5: 2.17, return20: 10.37, marketReturn5: 1.57, marketReturn20: 7.18, volumeRatio: 0.77, range20: 12.04 },
      },
      {
        date: '2023.06.27',
        stage: '기본·입주협약',
        title: '국토부·경기도·용인시·삼성전자·LH 협약',
        sourceUrl:
          'https://www.yongin.go.kr/home/www/www19/www19_02_01/www19_02_01_01.jsp',
        market: { close: 72600, volume: 9442997, return5: 0.55, return20: -3.58, marketReturn5: 0.46, marketReturn20: 2.13, volumeRatio: 0.77, range20: 6.06 },
      },
      {
        date: '2024.12.26',
        stage: '산단 승인',
        title: '산업단지계획 승인 및 실시협약',
        sourceUrl: 'https://www.korea.kr/news/policyNewsView.do?newsId=148937933',
        market: { close: 53600, volume: 10517075, return5: 4.29, return20: -2.24, marketReturn5: 2.43, marketReturn20: 3.61, volumeRatio: 0.59, range20: 11.19 },
      },
    ],
  },
  {
    id: 'saemangeum-secondary-battery',
    title: '새만금 이차전지 소재 투자협약',
    type: '지자체·국가산단 투자유치',
    region: '전북 군산시',
    category: '이차전지',
    summary:
      '새만금 국가산단의 기업 투자협약을 기준으로, 지자체 투자유치 발표가 상장기업의 실제 투자 계획과 어떻게 연결되는지 검토하는 사례입니다.',
    status: '직접 투자 근거 사례',
    statusType: 'success',
    researchQuestion: '지자체 투자협약 발표가 기업의 후속 공시·설비투자 계획으로 이어지는지 확인할 수 있는가?',
    priceStatus: '실제 종가 기준 이벤트 반응',
    market: {
      companyName: 'LG화학',
      stockCode: '051910',
      sourceTitle: '네이버페이 증권 일별 시세',
      sourceUrl: 'https://finance.naver.com/item/sise_day.nhn?code=051910',
      benchmarkTitle: 'KOSPI 일별 시세',
      benchmarkUrl: 'https://finance.naver.com/sise/sise_index.naver?code=KOSPI',
      verifiedAt: '2026.08.18',
      note: '수정주가가 아닌 일별 종가입니다. KOSPI 대비는 시장 전체와의 단순 비교이며 업황·실적 등 다른 요인의 영향을 분리하지 않은 관찰값입니다.',
    },
    signals: [
      { label: '직접성', icon: '✓', level: '높음', type: 'success', value: 88, detail: '투자협약 공개 확인' },
      { label: '사업 단계', icon: '↗', level: '보통', type: 'info', value: 68, detail: '협약 이후 집행·공시 확인' },
      { label: '시장·업황', icon: '≈', level: '분리 확인', type: 'warning', value: 42, detail: '이차전지 업황·원재료 비교 필요' },
      { label: '공시·실적', icon: '⌕', level: '추가 확인', type: 'info', value: 54, detail: '설비투자·재무 영향 확인' },
      { label: '거래 반응', icon: '▥', level: '높음', type: 'success', value: 74, detail: '협약일 거래량 평균 대비 증가' },
    ],
    companies: [
      {
        name: 'LG화학',
        code: '051910',
        relation: '투자협약 확인',
        relationType: 'success',
        basis: '새만금개발청이 LG화학·절강화유코발트의 이차전지 소재 제조시설 투자협약을 공개했습니다.',
      },
      {
        name: '에코프로머티리얼즈',
        code: '450080',
        relation: '입주 계획 언급',
        relationType: 'warning',
        basis: '새만금개발청 자료에서 이차전지 기업의 입주 계획 명단에 언급됩니다. 개별 사업·공시는 별도 확인이 필요합니다.',
      },
    ],
    events: [
      {
        date: '2023.04.19',
        stage: '투자협약',
        title: '이차전지 소재 제조시설 투자협약',
        sourceUrl: 'https://www.saemangeum.go.kr/sda/brd/view.do?key=2009074409621&nttSn=7332',
        market: { close: 790000, volume: 388626, return5: -7.97, return20: -11.65, marketReturn5: -3.50, marketReturn20: -1.45, volumeRatio: 1.75, range20: 18.48 },
      },
      {
        date: '2023.05.02',
        stage: '산단 투자 발표',
        title: '이차전지 기업 입주·투자 계획 공개',
        sourceUrl: 'https://saemangeum.go.kr/sda/brd/view.do?key=2009074409621&nttSn=7420',
        market: { close: 746000, volume: 203437, return5: -4.96, return20: -7.91, marketReturn5: -1.10, marketReturn20: 1.77, volumeRatio: 0.99, range20: 11.13 },
      },
    ],
  },
  {
    id: 'gadeokdo-airport',
    title: '가덕도신공항 특별법',
    type: '특별법·국가 인프라',
    region: '부산광역시',
    category: '인프라',
    summary:
      '법안의 국회 의결과 시행, 후속 기본계획을 추적하는 사례입니다. 특정 기업의 직접 참여가 확인되기 전에는 테마성 연결을 후보로 취급하지 않는 기준을 검증합니다.',
    status: '대조 사례',
    statusType: 'info',
    researchQuestion: '법안 통과 자체와 특정 상장기업의 직접 경제적 연결을 어떻게 구분할 것인가?',
    priceStatus: '기업 후보 생성 제외',
    signals: [
      { label: '직접성', icon: '!', level: '낮음', type: 'danger', value: 12, detail: '직접 참여 상장기업 미확인' },
      { label: '사업 단계', icon: '↗', level: '높음', type: 'success', value: 82, detail: '특별법·기본계획 절차 확인' },
      { label: '시장·업황', icon: '≈', level: '해당 없음', type: 'info', value: 0, detail: '후보 종목이 없어 비교 제외' },
      { label: '공시·실적', icon: '⌕', level: '해당 없음', type: 'info', value: 0, detail: '후보 종목이 없어 비교 제외' },
      { label: '거래 반응', icon: '▥', level: '제외', type: 'info', value: 0, detail: '테마성 후보 생성을 차단' },
    ],
    companies: [],
    events: [
      {
        date: '2021.02.26',
        stage: '국회 의결',
        title: '가덕도신공항 건설을 위한 특별법 국회 의결',
        sourceUrl: 'https://www.busan.go.kr/newairport/news/1485656',
      },
      {
        date: '2021.09.17',
        stage: '법 시행',
        title: '가덕도신공항 건설을 위한 특별법 시행',
        sourceUrl:
          'https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=&chrClsCd=010202&efYd=20210917&lsiSeq=230203&urlMode=lsInfoP',
      },
      {
        date: '2023.12',
        stage: '기본계획',
        title: '기본계획 확정·고시 절차',
        sourceUrl: 'https://www.molit.go.kr/USR/NEWS/m_71/dtl.jsp?id=95088729',
      },
    ],
  },
  createPolicyOnlyStudy({
    id: 'gumi-semiconductor-specialized-complex',
    title: '구미 반도체 국가첨단전략산업 특화단지',
    type: '국가 특화단지', region: '경상북도 구미시', category: '반도체', date: '2023.07.20', stage: '특화단지 지정',
    eventTitle: '국가첨단전략산업 특화단지 지정', sourceUrl: 'https://www.korea.kr/news/policyNewsView.do?newsId=148917980',
    companies: [{ name: 'LG이노텍', code: '011070', relation: '지역 입주기업', relationType: 'warning', basis: '정부 합동 자료에서 구미 특화단지의 선도기업으로 LG이노텍을 명시했습니다. 사업별 계약·매출 공시는 별도 확인이 필요합니다.', sourceUrl: 'https://mss.go.kr/common/board/Download.do?bcIdx=1051207&cbIdx=86&streFileNm=3ab1d7a7-76f1-4bcd-877b-07930921f57a.pdf' }],
    marketData: { close: 289000, return5: -6.75, return20: -11.42, marketReturn5: 0.14, marketReturn20: -3.68, volumeRatio: 0.88 },
  }),
  createPolicyOnlyStudy({
    id: 'cheongju-battery-specialized-complex',
    title: '청주 이차전지 국가첨단전략산업 특화단지',
    type: '지자체·기업 투자협약', region: '충청북도 청주시', category: '이차전지', date: '2022.12.19', stage: '투자협약',
    eventTitle: 'LG에너지솔루션 오창공장 신·증설 투자협약', sourceUrl: 'https://www.lg.co.kr/media/release/25695',
    companies: [{ name: 'LG에너지솔루션', code: '373220', relation: '투자협약 확인', relationType: 'success', basis: 'LG에너지솔루션이 충북도·청주시와 오창공장 배터리 생산시설 신·증설 투자협약을 체결했다고 공개했습니다.', sourceUrl: 'https://www.lg.co.kr/media/release/25695' }],
    marketData: { close: 482000, return5: -5.08, return20: -4.98, marketReturn5: -1.49, marketReturn20: 1.16, volumeRatio: 0.8 },
  }),
  createPolicyOnlyStudy({
    id: 'pohang-battery-specialized-complex',
    title: '포항 이차전지 국가첨단전략산업 특화단지',
    type: '국가 특화단지', region: '경상북도 포항시', category: '이차전지', date: '2023.07.20', stage: '특화단지 지정',
    eventTitle: '국가첨단전략산업 특화단지 지정', sourceUrl: 'https://www.korea.kr/news/policyNewsView.do?newsId=148917980',
    companies: [{ name: '포스코퓨처엠', code: '003670', relation: '지역 선도기업', relationType: 'warning', basis: '포항 이차전지 특화단지 공개 자료에서 포스코퓨처엠을 지역 선도기업으로 언급합니다. 개별 투자 공시와 분리해 확인해야 합니다.' }],
    marketData: { close: 450247, return5: 4.63, return20: -10.12, marketReturn5: 0.14, marketReturn20: -3.68, volumeRatio: 1.59 },
  }),
  createPolicyOnlyStudy({
    id: 'ulsan-battery-specialized-complex',
    title: '울산 이차전지 국가첨단전략산업 특화단지',
    type: '국가 특화단지', region: '울산광역시', category: '이차전지', date: '2023.07.20', stage: '특화단지 지정',
    eventTitle: '국가첨단전략산업 특화단지 지정', sourceUrl: 'https://www.korea.kr/news/policyNewsView.do?newsId=148917980',
    companies: [{ name: '삼성SDI', code: '006400', relation: '지역 생산거점', relationType: 'warning', basis: '울산 이차전지 특화단지 협력 자료에서 삼성SDI의 울산 사업장·협력 논의가 확인됩니다. 신규 투자 계약은 별도 공시로 확인해야 합니다.' }],
    marketData: { close: 670637, return5: -3.36, return20: -12.85, marketReturn5: 0.14, marketReturn20: -3.68, volumeRatio: 1.06 },
  }),
  createPolicyOnlyStudy({
    id: 'cheonan-asan-display-specialized-complex',
    title: '천안·아산 디스플레이 국가첨단전략산업 특화단지',
    type: '국가 특화단지', region: '충청남도 천안·아산시', category: '디스플레이', date: '2023.07.20', stage: '특화단지 지정',
    eventTitle: '국가첨단전략산업 특화단지 지정', sourceUrl: 'https://www.korea.kr/news/policyNewsView.do?newsId=148917980',
  }),
  createPolicyOnlyStudy({
    id: 'jeonju-carbon-materials-complex',
    title: '전주 탄소소재 소부장 특화단지',
    type: '소부장 특화단지', region: '전북특별자치도 전주시', category: '탄소소재', date: '2021.02.23', stage: '특화단지 지정',
    eventTitle: '소재·부품·장비 특화단지 지정', sourceUrl: 'https://www.korea.kr/news/cultureColumnView.do?newsId=148884314',
    companies: [{ name: '효성첨단소재', code: '298050', relation: '앵커 생산거점', relationType: 'warning', basis: '정부·전북 자료는 전주 탄소소재 특화단지의 탄소섬유 생산거점과 효성첨단소재를 연결합니다. 개별 사업 수익 반영은 공시 확인이 필요합니다.', sourceUrl: 'https://www.sobujang.net/comm/retrieveSbjThdj.do' }],
    marketData: { close: 296500, return5: 1.01, return20: 28.16, marketReturn5: 0.42, marketReturn20: -2.4, volumeRatio: 0.52 },
  }),
  createPolicyOnlyStudy({
    id: 'changwon-precision-machinery-complex',
    title: '창원 정밀기계 소부장 특화단지',
    type: '소부장 특화단지', region: '경상남도 창원시', category: '정밀기계', date: '2021.02.23', stage: '특화단지 지정',
    eventTitle: '소재·부품·장비 특화단지 지정', sourceUrl: 'https://www.korea.kr/news/cultureColumnView.do?newsId=148884314',
  }),
  ...NATIONAL_COMPLEX_CANDIDATES,
  ...BIO_COMPLEX_CANDIDATES,
  DEFENSE_CLUSTER_CANDIDATE,
]

export { CASE_STUDIES }
