# 스토어 썸네일 기획 · 이미지 프롬프트

상품·요금 스토어(/pricing) 카드 20개의 썸네일 기획과 이미지 생성 프롬프트예요.

## 1. 크몽에서 확인한 기준

- 크몽 서비스 메인 이미지는 **4:3 비율, 652×488px**(jpg·png)이에요. 판매자들은 선명도를 위해 2배인 1304×976px로 만들어요.
- 흰 배경은 목록 배경과 구분이 안 돼서 **색 있는 배경**을 권장해요.
- 썸네일은 목록에서 아주 작게 보여요. **핵심 하나**만 크게 보여야 눈에 띄어요.
- 참고: 크몽 메인이미지 제작·등록 가이드 (kmong.com/support/expert-center/posts/752)

## 2. 마케팅방주 썸네일 컨셉 — "채널 색 + 소품 하나"

| 요소 | 규칙 |
|---|---|
| 비율·크기 | 4:3, **1304×976px**로 만들고 webp로 저장 (사이트가 652×488 이하로 줄여서 보여 줌) |
| 배경 | 채널별 단색 + 은은한 방사형 그라데이션 (아래 표의 색) |
| 주인공 | 상품을 상징하는 **소품 1개**를 화면 오른쪽 절반에 크게 |
| 빈 공간 | **왼쪽 아래 40%는 비워 두기** — 사이트가 상품명을 이 자리에 얹어요 |
| 스타일 | 부드러운 3D 일러스트 (둥근 형태, 무광 재질, 밝은 조명) — 20장 모두 같은 스타일 |
| 글자 | **이미지 안에 글자·숫자·로고를 넣지 않아요.** 한글은 AI가 자주 틀리게 그리고, 상품명·가격이 바뀌면 이미지를 다시 만들어야 해서요. 제목·배지·채널명은 사이트가 위에 얹어요 |
| 상표 | 네이버·카카오·쿠팡·인스타그램·유튜브·당근 **로고와 고유 캐릭터를 그리지 않아요** (상표권). 지도 핀·말풍선 같은 일반 아이콘만 써요 |

채널별 배경색

| 채널 | 배경색 (HEX) |
|---|---|
| 블로그 | 하늘·파랑 #2563EB |
| 플레이스 | 초록 #059669 |
| 커머스 | 주황·빨강 #EA580C |
| 카페 | 호박색 #D97706 |
| AI | 보라 #7C3AED |
| SNS | 분홍 #DB2777 |
| 카카오맵 | 노랑 #FACC15 |
| 당근 | 당근색 #F97316 |
| 언론 | 남색 #3730A3 |

## 3. 공통 프롬프트 (모든 이미지 뒤에 붙이기)

```
soft 3D illustration, rounded clay-like shapes, matte materials, bright soft studio lighting, gentle shadows, minimal composition, one hero object placed in the right half of the frame, large empty clean area in the lower-left 40% for text overlay, solid {배경색} background with a subtle radial gradient, no text, no letters, no numbers, no logos, no watermark, aspect ratio 4:3, 1304x976
```

`{배경색}`은 채널 표의 HEX로 바꿔 넣어요 (예: `solid #059669 background`).

## 4. 상품별 프롬프트 (주인공 소품)

파일 이름은 `public/store/<파일명>.webp`로 저장해요.

| # | 카드 | 파일명 | 주인공 소품 프롬프트 (앞부분) |
|---|---|---|---|
| 1 | 블로그 상위노출 보장 | blog-guarantee | a golden trophy with a ribbon standing on top of a smartphone that shows a simple search results list with the first result glowing |
| 2 | 블로그 배포 (실명·준최적·최적) | blog-deploy | a stack of blog article cards flying out of an open laptop like paper airplanes, three cards in slightly different sizes |
| 3 | 공식 인플루언서 블로그 배포 | blog-influencer | a blog article card with a golden verified star badge and a small crown floating above it |
| 4 | 블로그 이웃 늘리기 | blog-neighbor | three friendly round avatar figures linked by soft glowing lines with small heart and plus icons around them |
| 5 | 블로그용 원고 작성 | 블로그용 원고 작성 (단일) | a fountain pen writing on a glowing document page with small sparkles suggesting AI help |
| 6 | 플레이스 상위노출 리워드 | place-reward | a map location pin climbing to the top of a rising bar chart staircase with an upward arrow |
| 7 | 플레이스 기본기 (SEO 세팅·영수증 리뷰) | place-basics | a tiny cute storefront with an awning, a checklist clipboard and a paper receipt next to it |
| 8 | 커머스 상위노출 (C사·쇼핑) | commerce | a shopping cart filled with parcel boxes next to a product card rising on an upward arrow |
| 9 | 카페 게시글 발행 | cafe-post | a cluster of colorful speech bubbles floating above small neighborhood house rooftops |
| 10 | 카페 공식 제휴 마케팅 | 카페 공식 제휴 마케팅 (단일) | two hands shaking in front of a community notice board with a blank banner |
| 11 | AI 검색 최적화 (AEO) | ai-aeo | a friendly round robot holding a magnifying glass over a small shop icon, a chat bubble beside it |
| 12 | 인스타그램 반응 늘리기 | instagram | a generic rounded-square camera icon with floating hearts and a small follower badge (not the Instagram logo) |
| 13 | 유튜브 채널 키우기 | youtube | a generic video player screen with a play triangle and a rising view counter bar (not the YouTube logo) |
| 14 | 카카오맵 트렌드랭킹 1~6위 보장 | kakaomap-trend | a folded paper map with a three-step winner podium and a location pin on the top step |
| 15 | 카카오맵 리뷰·트래픽 | kakaomap-review | a big location pin with five shiny stars orbiting it and a small review card |
| 16 | 당근 단골·찜·관심 | daangn-reaction | a cozy neighborhood house with a heart, a bookmark ribbon and a notification bell floating around it |
| 17 | 당근 후기·채팅 문의 | daangn-review | a smartphone showing a photo review card with stars and a chat bubble popping out |
| 18 | 당근 콘텐츠·광고 세팅 | daangn-content | a vertical smartphone video with a clapperboard, a small poster frame and a megaphone |
| 19 | 당근 관리 프로젝트 (A~S) | daangn-project | a desk calendar with check marks and a small plant pot growing step by step |
| 20 | 보도자료 언론 송출 | press | a rolled newspaper with a megaphone and small spark lines, a press badge clipped on top |

**예시 — 1번 블로그 상위노출 보장 (전체 프롬프트)**

```
a golden trophy with a ribbon standing on top of a smartphone that shows a simple search results list with the first result glowing, soft 3D illustration, rounded clay-like shapes, matte materials, bright soft studio lighting, gentle shadows, minimal composition, one hero object placed in the right half of the frame, large empty clean area in the lower-left 40% for text overlay, solid #2563EB background with a subtle radial gradient, no text, no letters, no numbers, no logos, no watermark, aspect ratio 4:3, 1304x976
```

네거티브 프롬프트를 받는 도구라면: `text, letters, korean characters, numbers, logo, watermark, brand mark, busy background, photorealistic people`

## 5. 사이트에 넣는 법

1. 만든 이미지를 1304×976 webp로 저장해 `public/store/`에 넣어요 (예: `public/store/blog-guarantee.webp`).
2. `src/lib/store.ts`의 `STORE_IMAGES`에 한 줄 추가해요.
   - 묶음 상품: `"blog-guarantee": "/store/blog-guarantee.webp"`
   - 단일 상품: `"blog-블로그용 원고 작성": "/store/blog-write.webp"`
3. 이미지가 없으면 지금처럼 채널 색 그라데이션이 나와요. 이미지 위에는 사이트가 상품명·채널·배지를 자동으로 얹어요.
