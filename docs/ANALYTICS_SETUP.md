# 방문자 추적 (GA4 + GTM)

두 태그 모두 코드에 기본값으로 들어 있어 **GitHub 변수 없이도 프로덕션 빌드에 자동 적용**됩니다
(`src/lib/trackingIds.ts`, 로컬 개발 서버에서는 로드하지 않음).

| 태그 | ID | 로드 방식 |
|---|---|---|
| GA4 | `G-V2W8DGXT7W` | gtag.js 직접 로드 (`src/components/GtmScript.tsx`) |
| GTM | `GTM-NF44W8RR` | 컨테이너 로드 (head 스크립트 + body noscript) |

- 페이지뷰: GA4 기본 설정(향상된 측정 → "브라우저 기록 이벤트 기반 페이지 변경")으로 화면 이동까지 집계.
- 전환 이벤트 6종: `track()`이 GA4로 이벤트 이름 그대로 전송 + `dataLayer`에도 push.
- **GTM 안에 GA4 태그를 추가하지 말 것** — 페이지뷰가 두 번 집계됩니다. GTM은 메타 픽셀 등 다른 태그용.
- ID 변경이 필요하면 GitHub 변수 `NEXT_PUBLIC_GA4_MEASUREMENT_ID` / `NEXT_PUBLIC_GTM_ID`로 덮어쓰기.

## GA4 설정 (선택)

1. 관리 → 맞춤 정의 → 맞춤 측정기준: `product_slug`, `step` (범위: 이벤트)
2. 관리 → 주요 이벤트 → 새 주요 이벤트: `signup_complete`

## 확인

GA4 → 보고서 → **실시간**에서 1분 안에 내 방문이 보입니다.
