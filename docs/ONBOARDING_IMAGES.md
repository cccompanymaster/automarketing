# 온보딩 스토리 이미지 — 생성 프롬프트

`/start` → "처음이에요" 온보딩 4단계에 들어갈 일러스트입니다.
이미지를 생성해서 주시면 `public/onboarding/step-1.png ~ step-4.png` 로 넣고
코드의 `image` 필드만 켜면 바로 적용됩니다.

## 공통 스펙 (모든 장 동일하게)
- **크기**: 800×400 (가로형, 2:1) — 화면에는 320×160으로 축소 표시
- **포맷**: PNG 또는 WebP
- **스타일 통일 문구** (모든 프롬프트 끝에 붙이기):
  > flat vector illustration, soft rounded shapes, warm friendly Korean small-business setting, pastel palette with emerald green (#059669) accent, clean white background, no text, no letters, no logos, 2:1 wide composition

> ⚠️ 4장을 **같은 세션/같은 스타일**로 생성해야 톤이 맞습니다. "no text" 필수
> (AI가 넣는 글자는 대부분 깨져 보입니다).

---

## 1단계 — 대행사에 데인 사장님 (step-1.png)
분위기: 답답함·허탈함. 어두운 느낌이 아니라 "하아…" 정도의 코믹한 지침.

```
A tired Korean small restaurant owner in an apron sitting at a small table at
night, resting chin on hand with a long sigh, looking at a laptop showing a
vague chart report, a few crumpled papers and a phone showing a call on hold,
dim cozy shop interior in the background --- flat vector illustration, soft
rounded shapes, warm friendly Korean small-business setting, pastel palette
with emerald green (#059669) accent, clean white background, no text, no
letters, no logos, 2:1 wide composition
```

## 2단계 — 견적 룰렛 (step-2.png)
분위기: 혼란. 업체마다 다른 가격표가 날아다니는 느낌.

```
A confused Korean shop owner standing between three salespeople each holding
up a different price tag of different sizes, question marks floating above
the owner's head, the price tags shaped like blank cards with only numbers
implied (no readable text), slight casino-roulette feeling --- flat vector
illustration, soft rounded shapes, warm friendly Korean small-business
setting, pastel palette with emerald green (#059669) accent, clean white
background, no text, no letters, no logos, 2:1 wide composition
```

## 3단계 — 반전: 전부 있고, 원가에 딱 (step-3.png)
분위기: 시원함·통쾌함. 거품이 걷히고 투명한 진열대가 열리는 느낌.

```
A bright open market stall displaying many small marketing service items as
cute icons on shelves (map pin, blog pencil, camera, megaphone, sparkles),
each with a tiny visible price tag (blank, no readable text), a shopkeeper
happily sweeping away soap bubbles labeled as overhead, sense of transparency
and abundance --- flat vector illustration, soft rounded shapes, warm friendly
Korean small-business setting, pastel palette with emerald green (#059669)
accent, clean white background, no text, no letters, no logos, 2:1 wide
composition
```

## 4단계 — 승선: 직접 조종하는 사장님 (step-4.png)
분위기: 자신감·출발. 브랜드 모티프(방주/배)와 연결.

```
A confident Korean small-business owner standing at the helm of a friendly
small green ship shaped like a modern dashboard, one hand on the wheel and
one finger tapping a floating glowing button, calm sea and sunrise ahead,
small sprout emblem on the flag --- flat vector illustration, soft rounded
shapes, warm friendly Korean small-business setting, pastel palette with
emerald green (#059669) accent, clean white background, no text, no letters,
no logos, 2:1 wide composition
```

---

## 받은 뒤 적용 방법
1. 4장을 `public/onboarding/step-1.png` ~ `step-4.png` 로 저장 (채팅으로 주시면 제가 넣습니다)
2. `src/components/Onboarding.tsx` 의 각 STEP에 `image: "/onboarding/step-N.png"` 추가
3. 빌드/배포 — 끝
