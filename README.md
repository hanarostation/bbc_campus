# Save 119 · 한국성서침례교회

정적 HTML 사이트입니다. 빌드 과정 없이 저장소를 그대로 호스팅하면 됩니다.

## 구성

```
index.html      Save 119 (기존 save119.com 복음 콘텐츠)
contact.html    연락하기 (교회 지도 + 내 위치 기반 가까운 교회, 87곳 목록·지역 필터·검색)
campus.html     BBC Campus (성경적 가치 교육 홍보)
seminary.html   성서침례교회신학교 (신학교 소개, koreabbc.kr 연결)
404.html        없는 주소로 접속했을 때 보여줄 페이지
assets/css/style.css
assets/js/main.js
assets/js/church-map.js   연락하기 지도 (Leaflet)
assets/img/     사진·아이콘 (메타데이터 제거·용량 최적화 완료)
.nojekyll       GitHub Pages가 파일을 그대로 서비스하도록 하는 설정 파일
```

- 다크 / 라이트 모드: 기기 설정을 따르며, 우측 상단 버튼으로 바꿀 수 있습니다. (선택값은 브라우저에 저장)
- 반응형: 휴대폰 · 태블릿 · PC 레이아웃 모두 지원

## GitHub에 올리기

```bash
cd save119-site
git init
git add .
git commit -m "Save 119 사이트"
git branch -M main
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

GitHub 저장소 → **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `/ (root)` → Save

## 가비아 도메인 연결

1. GitHub **Settings → Pages → Custom domain**에 구매한 도메인(예: `example.com`)을 입력하고 저장합니다. (저장소에 `CNAME` 파일이 자동으로 생깁니다)
2. 가비아 **My가비아 → 도메인 관리 → DNS 정보 → DNS 설정**에서 아래 레코드를 추가합니다.

| 타입 | 호스트 | 값 |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<계정>.github.io.` |

3. DNS 반영(보통 수십 분~최대 48시간) 후, Pages 설정에서 **Enforce HTTPS**를 체크합니다.

## 수정 안내

- **BBC Campus 링크**: 캠퍼스 사이트가 준비되면 `campus.html`의 `Coming soon` 표시와 하단 버튼을 실제 주소로 바꾸면 됩니다.
- **교회 목록·지도**: `contact.html`의 `<article class="ccard">` 블록과, 같은 파일 아래쪽 `<script id="church-data">`의 좌표 데이터(lat/lng)를 함께 수정합니다.
  - 지도: Leaflet + OpenStreetMap/CARTO 지도 타일(무료, API 키 불필요). 좌표는 OpenStreetMap 주소 검색으로 구했으며 24곳은 읍·면·구 단위의 대략적 위치입니다(`"approx": true`).
  - "내 위치에서 가까운 교회"는 브라우저 위치 권한을 사용하며, HTTPS 주소(GitHub Pages의 Enforce HTTPS)에서만 동작합니다.
  출처: 한국성서침례교회 목회자 친교회 회원교회 안내 (koreabbf.org/sub/0107.php)
