# 방문자·성과 추적 설정

모든 ID는 `src/lib/trackingIds.ts`가 읽어요. **ID가 비어 있는 도구는 꺼진 상태**라 스크립트를 불러오지 않고,
보안 설정(CSP, `src/lib/csp.ts`)에도 그 도구 주소가 들어가지 않으며 개인정보처리방침 5항에도 나오지 않아요. ID를 넣으면 다음 배포부터 켜지고 방침 문구도 자동으로 바뀌어요.
(개발 서버에서는 어떤 도구도 불러오지 않아요.)

## 현재 상태
| 도구 | 상태 | ID 넣는 곳 (GitHub → Settings → Secrets and variables → Actions → **Variables**) |
|---|---|---|
| GA4 (`G-DFPTX589SZ`) | 켜짐 (코드 기본값) | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`로 덮어쓰기 가능 |
| GTM | **꺼짐** (2026-11-11: 공개된 `GTM-NF44W8RR` 컨테이너에 태그가 0개였음 — 메타 픽셀이 없었음) | 쓰려면 `NEXT_PUBLIC_GTM_ID` |
| 네이버 (프리미엄 로그분석 또는 애널리틱스) | ID 대기 | `NEXT_PUBLIC_NAVER_ANALYTICS_ID` — 검색광고를 하면 광고 관리 → 도구 → 프리미엄 로그분석 신청 → 설치 안내 메일의 AccountId. 애널리틱스와 **둘 중 하나만** |
| Meta 픽셀 | ID 대기 | `NEXT_PUBLIC_META_PIXEL_ID` (이벤트 관리자 → 픽셀 ID) |
| 카카오 픽셀 | ID 대기 | `NEXT_PUBLIC_KAKAO_PIXEL_ID` (카카오 비즈니스 → 픽셀 & SDK → Track ID) |
| 당근 픽셀 | ID 대기 | `NEXT_PUBLIC_KARROT_PIXEL_ID` (당근 비즈니스 전문가모드 → 전환 추적 관리) |
| Core Web Vitals → GA4 | GA4와 함께 켜짐 | 필요 없음 |
| Microsoft Clarity | ID 대기 | `NEXT_PUBLIC_CLARITY_ID` (clarity.microsoft.com → 새 프로젝트 → 설정 → 개요의 프로젝트 ID) |
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
| `ai_referral` | ChatGPT·Perplexity·Claude·Gemini 등 AI 답변에서 들어옴 (`ai_source`) |
| `LCP`, `INP`, `CLS`, `FCP`, `TTFB` | 실제 방문자의 페이지 속도 (값: ms, CLS는 ×1000, `metric_rating`: good/needs-improvement/poor) |

- **GTM을 다시 켜더라도 GA4·광고 픽셀 태그는 넣지 말 것** — 코드가 이미 보내서 두 번 집계돼요.

## 광고 픽셀로 가는 전환 (`src/lib/adPixels.ts` PIXEL_EVENTS)
| 사이트 이벤트 | 네이버 | Meta | 카카오 | 당근 |
|---|---|---|---|---|
| `generate_lead` | lead | Lead | participation | Lead |
| `signup_complete` | sign_up | CompleteRegistration | completeRegistration | CompleteRegistration |
| `begin_checkout` | — | InitiateCheckout | — | — |
| `purchase` (캐시 차감 주문, 금액 포함) | purchase | Purchase | purchase | Purchase |

페이지 이동(사이트 안 링크)마다 각 픽셀의 페이지뷰도 다시 보내요(`components/AdPixels.tsx`).

## 유입 경로 (`src/lib/attribution.ts`)
광고·검색·SNS·AI 답변으로 들어오면 이 브라우저에 90일 기억해 두었다가
- 회원가입 때 Supabase `user_metadata.source`에 "처음: naver / cpc 「키워드」 → /pricing/ (11/11) | 신청: /start/" 한 줄로 저장
- 웹훅(Apps Script) 문의에 `source` 칸으로 전송
- Supabase 문의(`submit_inquiry`): `supabase/inquiry_source.sql`을 SQL Editor에서 한 번 실행하면 `inquiries.source`에 저장되고 관리자 → 문의에 "유입: …"으로 보여요. 실행 전에는 사이트가 알아서 예전 방식으로 접수해요(문의가 막히지 않음)
- GA4 설정(선택): 관리 → 맞춤 정의 → 맞춤 측정기준 `product_slug`, `step`, `metric_rating`, `ai_source` (범위: 이벤트) / 관리 → 주요 이벤트 → `signup_complete`, `purchase`, `generate_lead` / 데이터 보존 14개월 / 채널 그룹에 `AI 검색` 채널(소스 정규식 `.*(chatgpt|openai|perplexity|claude|gemini|copilot|wrtn|clova|liner|you\.com|phind|deepseek|grok).*`, '추천'보다 위).

## UTM 링크
관리자 → 바로가기 → **UTM 링크 만들기**에서 만들어요. 채널마다 source/medium이 고정이라(`src/lib/utm.ts`) GA4 → 획득 → 트래픽 획득에서 채널별로 깔끔하게 나뉘어요.
캠페인 이름 규칙: `연-월_내용` (예: `2026-11_원고500원`).

## 개인정보 보호
- 주문·충전·문의 창, 로그인·가입 폼, 내 정보, 마이페이지, 관리자 화면은 Clarity 녹화에서 가려져요(`data-clarity-mask`).
- 분석 이벤트에는 이름·연락처·요청 내용·검색어 속 숫자/이메일을 넣지 않아요.
- 새 추적 도구를 붙이면 `trackersInUse()`에 추가해 개인정보처리방침 5항에 자동으로 나오게 하세요.
