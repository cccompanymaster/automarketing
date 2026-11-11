# 방문자·성과 추적 설정

모든 ID는 `src/lib/trackingIds.ts`가 읽어요. **ID가 비어 있는 도구는 꺼진 상태**라 스크립트를 불러오지 않고,
개인정보처리방침 5항에도 나오지 않아요. ID를 넣으면 다음 배포부터 켜지고 방침 문구도 자동으로 바뀌어요.
(개발 서버에서는 어떤 도구도 불러오지 않아요.)

## 현재 상태
| 도구 | 상태 | ID 넣는 곳 (GitHub → Settings → Secrets and variables → Actions → **Variables**) |
|---|---|---|
| GA4 (`G-DFPTX589SZ`) | 켜짐 (코드 기본값) | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`로 덮어쓰기 가능 |
| GTM (`GTM-NF44W8RR`) | 켜짐 (코드 기본값) | `NEXT_PUBLIC_GTM_ID` |
| Core Web Vitals → GA4 | GA4와 함께 켜짐 | 필요 없음 |
| Microsoft Clarity | ID 대기 | `NEXT_PUBLIC_CLARITY_ID` (clarity.microsoft.com → 새 프로젝트 → 설정 → 개요의 프로젝트 ID) |
| 네이버 애널리틱스 | ID 대기 | `NEXT_PUBLIC_NAVER_ANALYTICS_ID` (analytics.naver.com → 사이트 등록 → 발급된 사이트 ID) |
| 구글 서치콘솔 소유 확인 | 코드 대기 | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (URL 접두어 → HTML 태그 → `content="…"` 안의 값만) |
| Bing 웹마스터 소유 확인 | 코드 대기 | `NEXT_PUBLIC_BING_SITE_VERIFICATION` (`msvalidate.01`의 content 값만. 서치콘솔에서 가져오기를 쓰면 필요 없음) |
| 네이버 서치어드바이저 | 확인 완료 | 코드에 고정 |

GitHub 변수 대신 `trackingIds.ts`의 기본값 칸에 직접 넣어도 돼요. 모두 공개돼도 되는 값이에요.

## 이벤트 (GA4 → 보고서 → 이벤트)
| 이벤트 | 언제 |
|---|---|
| `cta_click`, `onboarding_step_view`, `onboarding_complete`, `signup_start`, `signup_complete`, `login_success` | 가입 흐름 |
| `search`, `select_item`, `view_item`, `begin_checkout`, `purchase`, `charge_start` | 스토어·주문·충전 |
| `generate_lead` | 사이트 문의 접수 |
| `LCP`, `INP`, `CLS`, `FCP`, `TTFB` | 실제 방문자의 페이지 속도 (값: ms, CLS는 ×1000, `metric_rating`: good/needs-improvement/poor) |

- **GTM 안에 GA4 태그를 추가하지 말 것** — 페이지뷰가 두 번 집계돼요.
- GA4 설정(선택): 관리 → 맞춤 정의 → 맞춤 측정기준 `product_slug`, `step`, `metric_rating` (범위: 이벤트) / 관리 → 주요 이벤트 → `signup_complete`, `purchase`, `generate_lead`.

## UTM 링크
관리자 → 바로가기 → **UTM 링크 만들기**에서 만들어요. 채널마다 source/medium이 고정이라(`src/lib/utm.ts`) GA4 → 획득 → 트래픽 획득에서 채널별로 깔끔하게 나뉘어요.
캠페인 이름 규칙: `연-월_내용` (예: `2026-11_원고500원`).

## 개인정보 보호
- 주문·충전·문의 창, 로그인·가입 폼, 내 정보, 마이페이지, 관리자 화면은 Clarity 녹화에서 가려져요(`data-clarity-mask`).
- 분석 이벤트에는 이름·연락처·요청 내용·검색어 속 숫자/이메일을 넣지 않아요.
- 새 추적 도구를 붙이면 `trackersInUse()`에 추가해 개인정보처리방침 5항에 자동으로 나오게 하세요.
