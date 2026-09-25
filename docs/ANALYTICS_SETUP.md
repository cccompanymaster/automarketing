# 방문자 추적 (GTM + GA4)

사이트는 GTM 컨테이너 하나만 불러오고(`src/components/GtmScript.tsx`), 모든 전환 이벤트는
`src/lib/analytics.ts`의 `track()`이 `dataLayer`에 넣습니다. GA4·메타 픽셀은 GTM 안에서 설정합니다.
**GA4가 안내하는 gtag.js 코드는 사이트에 넣지 않습니다** (넣으면 페이지뷰가 두 번 집계됨).

- GA4 측정 ID: `G-V2W8DGXT7W`
- GTM 컨테이너 ID: `GTM-NF44W8RR`
- GTM 가져오기 파일: `docs/gtm-container.json`
  - `GA4 - 구글 태그` (모든 페이지)
  - `GA4 - 전환 이벤트` (이벤트 6종을 이름 그대로 전송, 매개변수 `product_slug`, `step`)

## 순서

1. GTM → 관리 → **컨테이너 가져오기** → `gtm-container.json` 선택 → 작업공간 "기존" → **병합(덮어쓰기)** → 확인
2. GTM 오른쪽 위 **제출 → 게시**
3. GitHub → Settings → Secrets and variables → Actions → Variables → `NEXT_PUBLIC_GTM_ID` = `GTM-NF44W8RR` → 재배포
4. GA4 → 관리 → 맞춤 정의 → 맞춤 측정기준: `product_slug`, `step` (범위: 이벤트)
5. GA4 → 관리 → 주요 이벤트 → 새 주요 이벤트: `signup_complete` (필요 시 `cta_click`)

## 확인

GTM **미리보기**로 selfmarketing.ai.kr 을 열어 가입 흐름을 진행하면 이벤트가 태그에 잡히는지 보입니다.
GA4 → 보고서 → **실시간**에서도 1분 안에 확인됩니다.
