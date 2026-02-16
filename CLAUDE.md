# National Flag Game

어린이용 국기 맞추기 퀴즈 게임. GitHub Pages로 서빙하는 순수 HTML/CSS/JS 단일 파일 앱.

## 프로젝트 구조

```
index.html              # 메인 앱 (HTML + CSS + JS 올인원)
data/countries.json     # 246개 국가/지역 데이터
assets/flags/{code}.png # 국기 이미지 (320px PNG, 246개)
scripts/fetch-flags.mjs # 데이터 재수집 스크립트
```

## 게임 기능

- **모드 선택**: 대륙별 (Africa, Americas, Asia, Europe, Oceania, Antarctic) + 전체
- **퀴즈**: 국기 이미지 보고 3지선다 (정답 1 + 같은 대륙 오답 2), 한글/영어 병기
- **힌트 토글**: 💡 버튼으로 국가 설명(수도, 인구, 면적, 언어, 통화, 지역) on/off (localStorage 저장)
- **대륙 배지**: 국기 위에 해당 대륙 한글/영어 표시
- **피드백**: 정답 시 국가명(한/영) 표시 + 초록 글로우 + 컨페티 폭발, 오답 시 빨간 테두리 + 흔들림 (문구 없음)
- **결과 화면**: 점수/퍼센트 바/별점 표시
- **반응형 풀페이지**: 스크롤 없이 모든 화면 크기 대응

## 데이터 구조

### countries.json (`data/countries.json`)

246개 국가/지역 데이터. `name_ko` 기준 가나다순 정렬.

```json
{
  "code": "kr",           // ISO 3166-1 alpha-2 (소문자)
  "name_ko": "한국",       // 한국어 국가명
  "name_en": "South Korea", // 영어 국가명
  "description": {
    "capital": "Seoul",           // 수도
    "population": 51159889,       // 인구
    "area_km2": 100210,           // 면적 (km²)
    "languages": ["Korean"],      // 공용어 목록
    "currency": "South Korean won (₩)", // 통화명 (기호)
    "subregion": "Eastern Asia"   // 세부 지역
  },
  "flag_uri": "assets/flags/kr.png", // 국기 이미지 경로 (320px PNG)
  "continent": "Asia"     // 대륙 (Africa, Americas, Asia, Europe, Oceania, Antarctic)
}
```

### 제외된 영토 (부모 국가와 동일 국기)

- `um` 미국령 군소 제도 (= us 미국)
- `bv` 부베 섬 (= no 노르웨이)
- `sj` 스발바르 얀마옌 제도 (= no 노르웨이)
- `mf` 생마르탱 (= fr 프랑스)

### 국기 이미지 (`assets/flags/`)

- 246개 PNG 파일, 320px 너비
- 파일명: `{code}.png` (예: `kr.png`, `jp.png`, `us.png`)
- 출처: flagcdn.com

### 데이터 소스

- REST Countries API (`https://restcountries.com/v3.1/all`)
- 수집 스크립트: `scripts/fetch-flags.mjs` (`node scripts/fetch-flags.mjs`로 재수집 가능)
