---
title: "광고 효과 확인하는 법 — 채널마다 UTM 링크 따로 만들기"
slug: utm-link-guide
question: "UTM 링크 만드는 법"
answer: "채널마다 utm_source·utm_medium·utm_campaign을 붙인 링크를 따로 쓰면 GA4에서 유입 채널을 나눠 볼 수 있어요."
description: "인스타그램·블로그·당근·문자 중 어디서 손님이 들어왔는지 알려면 채널마다 다른 UTM 링크를 쓰면 돼요. UTM 다섯 가지 항목의 뜻, 실제 링크 예시, 이름 짓는 규칙, 구글 애널리틱스(GA4)에서 확인하는 메뉴와 자주 하는 실수를 정리했어요."
thumb: "UTM 링크|광고 효과"
emoji: "🔗"
theme: sky
type: question
datePublished: 2026-11-13
dateModified: 2026-11-13
data_asof: 2026-11-11
author: "마케팅방주 편집팀"
reviewedBy: "마케팅방주 편집팀 (Google 애널리틱스 고객센터 — 맞춤 URL로 캠페인 데이터 수집 안내 대조)"
sources:
  - { name: "Google 애널리틱스 고객센터 — 맞춤 URL로 캠페인 데이터 수집", url: "https://support.google.com/analytics/answer/10917952" }
  - { name: "Google — Campaign URL Builder", url: "https://ga-dev-tools.google/campaign-url-builder/" }
faq:
  - { q: "UTM을 붙이면 링크가 길어지는데 괜찮나요?", a: "작동에는 문제없어요. 길이가 신경 쓰이면 단축 URL 서비스로 줄여서 쓰면 돼요. 줄인 링크도 열리면 원래 UTM 주소로 이동해서 그대로 집계돼요." }
  - { q: "네이버 블로그나 플레이스에 넣는 링크에도 붙일 수 있나요?", a: "네. 블로그 본문이나 플레이스의 홈페이지 링크처럼 우리 홈페이지로 넘어오는 링크라면 붙일 수 있어요. 다만 네이버 플레이스 자체의 방문 통계는 스마트플레이스 통계에서 따로 봐야 해요." }
  - { q: "홈페이지 안의 메뉴 링크에도 UTM을 붙여야 하나요?", a: "아니요. 우리 사이트 안에서 이동하는 링크에 붙이면 유입 경로가 덮어써져서 원래 어디서 왔는지 알 수 없게 돼요. 외부 채널에서 들어오는 링크에만 붙이세요." }
related: [instagram-profile-setup, marketing-budget-plan, blog-exposure-check]
status: published
changelog:
  - "2026-11-13 발행"
---

## UTM이 뭔가요

UTM은 링크 끝에 붙이는 꼬리표예요. 손님이 그 링크로 들어오면 구글 애널리틱스(GA4)가 꼬리표를 읽어서 **어느 채널, 어느 캠페인**으로 왔는지 기록해요. Google 애널리틱스 고객센터 안내 기준이에요 (2026-11-11 확인).

| 항목 | 뜻 | 예시 |
|---|---|---|
| utm_source | 어디서 왔나 (사이트·앱 이름) | instagram, naver_blog, daangn |
| utm_medium | 어떤 방식인가 | social, blog, sms, cpc |
| utm_campaign | 어떤 행사·캠페인인가 | 2026_11_open |
| utm_term | (선택) 검색 광고 키워드 | 연수동_네일 |
| utm_content | (선택) 같은 캠페인 안의 구분 | profile_link, story_1 |

source·medium·campaign 세 가지는 꼭 넣고, 나머지는 필요할 때만 써요.

## 실제 링크 예시

같은 11월 오픈 이벤트를 채널마다 다른 링크로 알리는 경우예요.

| 채널 | 링크 |
|---|---|
| 인스타그램 프로필 | `https://우리가게.com/?utm_source=instagram&utm_medium=social&utm_campaign=2026_11_open` |
| 블로그 글 | `https://우리가게.com/?utm_source=naver_blog&utm_medium=blog&utm_campaign=2026_11_open` |
| 단골 문자 | `https://우리가게.com/?utm_source=sms&utm_medium=sms&utm_campaign=2026_11_open` |

주소 뒤 첫 항목은 `?`로, 그다음부터는 `&`로 이어요. 직접 쓰기 번거로우면 Google의 Campaign URL Builder에 칸만 채우면 링크를 만들어 줘요.

## 이름 짓는 규칙

- **소문자로 통일**: GA4는 대소문자를 구분해서 `Instagram`과 `instagram`을 다른 채널로 집계해요.
- **띄어쓰기 대신 밑줄**: `2026 11 open`보다 `2026_11_open`.
- **한 번 정한 이름은 계속**: 표로 정리해 두고 같은 채널엔 같은 이름을 써요.

## GA4에서 확인하는 곳

GA4의 **보고서 → 획득 → 트래픽 획득**에서 '세션 소스/매체'나 '세션 캠페인'으로 보면 채널별 방문 수와 전환 수를 비교할 수 있어요. 링크를 만든 날에는 직접 한 번 눌러 보고, 실시간 보고서에 해당 소스가 잡히는지 확인하세요.

## 이럴 때 써 보세요

- [인스타그램 프로필](/column/instagram-profile-setup/) 링크, 스토리 링크를 나눠서 어느 쪽이 더 들어오는지 볼 때
- 블로그 배포 글에 넣은 링크가 실제 방문으로 이어지는지 볼 때 ([블로그 노출 확인 방법](/column/blog-exposure-check/)과 함께)
- [월 마케팅 예산](/column/marketing-budget-plan/)을 다음 달에 어느 채널로 옮길지 정할 때

UTM은 '어디서 들어왔는지'만 알려 줘요. 실제 매출로 이어졌는지는 예약·주문·문의 수와 함께 봐야 정확해요. 다른 운영 가이드는 [마케팅 칼럼](/column/)에 모아 두었어요.
