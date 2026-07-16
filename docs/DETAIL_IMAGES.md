# 상품 상세페이지 스토리 이미지 — 생성 프롬프트 기획

각 상품 상세의 "이런 것 때문에 힘드셨죠" 섹션 상단에 들어가는 와이드 일러스트입니다.
생성해서 주시면 `public/details/<slug>.png` 로 넣고 `productStories.ts` 의
`image` 필드만 켜면 적용됩니다.

## 공통 스펙
- **크기**: 1200×500 (와이드, 12:5) — 화면에서 가로 꽉 차게 표시
- **포맷**: PNG 또는 WebP
- **파일명**: 아래 표의 slug 그대로 (`place.png`, `cafe.png` …)
- **스타일 통일 문구** (모든 프롬프트 끝에 붙이기):
  > flat vector illustration, soft rounded shapes, warm friendly Korean
  > small-business setting, pastel palette with emerald green (#059669)
  > accent, clean light background, no text, no letters, no logos,
  > 12:5 wide banner composition

> ⚠️ 같은 세션/스타일로 뽑아야 톤이 맞습니다. "no text" 필수.
> 각 장면은 "불편 → 살짝 희망" 느낌: 어둡지 않게, 코믹한 한숨 정도로.

## 상품별 프롬프트 (13종)

| slug | 장면 프롬프트 (앞부분만, 끝에 공통 문구 붙이기) |
|---|---|
| `place` | A Korean restaurant owner looking at a large map app on a tablet, their small shop pin buried low in a long ranking list while a rival's pin shines at the top, owner scratching head |
| `shopping` | An online seller surrounded by floating blank ad-spend receipts flying out of a laptop like a whirlwind, empty shopping cart beside them, worried but determined face |
| `blog` | A shop owner reading a blog post on a laptop where the page looks like a copy of a copy (stacked identical ghost pages behind the screen), unimpressed expression |
| `blogwrite` | A tired owner at midnight in a closed shop, staring at a blank notebook page with a pencil, a friendly robot assistant peeking from the side holding a finished page |
| `blog-neighbor` | A lonely blogger character watering a tiny sprout labeled as a blog (no text), while across the fence a lively garden full of visiting people chatters |
| `experience` | A cafe owner holding an open door with a welcome mat, but the queue outside is made of transparent ghost silhouettes (no-shows), one real customer taking photos happily |
| `instagram` | A shop owner's phone showing a profile with a crowd of obviously fake robot followers on one side and a small group of warm real Korean customers on the other side |
| `youtube` | A gym owner filming a workout video with a phone tripod, view counter shown as a tiny sad sprout, imagined big audience as a faint dream bubble above |
| `kakaomap` | A store owner juggling two map pins — one polished and glowing (naver-green), one dusty and cracked (yellow) — trying to polish the yellow one with a cloth |
| `cafe` | A nervous shop owner tip-toeing into a big cozy clubhouse full of chatting moms with strollers, holding a gift basket, a bouncer character checking a membership card at the door |
| `ai-influencer` | A customer asking a friendly glowing AI orb for a recommendation, the orb projecting a podium of three shops where the owner's shop is missing, owner peeking from the side |
| `place-traffic` | A shop owner comparing three roadside stalls selling the same arrow-shaped "traffic" item at wildly different price tags (blank tags), suspicious expression |
| `consulting` | An overwhelmed owner at a crossroads with many signposts pointing everywhere (blank signs), a friendly guide character with a green compass offering one clear path |

## 받은 뒤 적용 방법
1. 13장을 `public/details/<slug>.png` 로 저장 (채팅으로 주시면 제가 저장)
2. `src/lib/productStories.ts` 각 항목에 `image: "/details/<slug>.png"` 추가
3. 빌드/배포 — 끝

> 참고: `press`(언론보도)·`refund`(광고비 환급)는 전용 랜딩 페이지를 쓰고 있어
> 이번 스토리 섹션 대상에서 제외했습니다. 원하시면 그 페이지들도 같은 형식으로
> 확장할 수 있어요.
