# 온보딩 컷만화 — 생성 프롬프트 (4단계 × 3컷 = 12컷)

`/start` → **처음이에요** 를 누르면 나오는 4단계 스토리에 들어갈 컷만화입니다.
각 단계 문구(`src/components/Onboarding.tsx`)에 맞춰 3컷씩 구성했습니다.

## 먼저 읽어주세요 — 제작 방식

1. **그림에는 글자·말풍선을 넣지 않습니다.**
   AI가 그리는 한글은 대부분 깨집니다. 말풍선과 대사는 제가 코드로 그림 위에 얹습니다
   → 글씨가 선명하고, 대사를 나중에 바꿔도 그림을 다시 뽑을 필요가 없습니다.
   그래서 모든 컷은 **위쪽 1/4을 비워두도록** 프롬프트에 넣어뒀습니다(말풍선 자리).
2. **등장인물이 컷마다 똑같이 생겨야 만화가 됩니다.** 아래 순서를 꼭 지켜주세요.
   - ① 캐릭터 시트를 먼저 1장 뽑는다
   - ② 마음에 들면, 이후 12컷은 **그 시트를 참고 이미지로 붙여서** 생성
     - ChatGPT: 같은 대화창에서 시트 이미지를 올리고 "이 캐릭터 그대로" 요청
     - Midjourney: `--cref <시트 이미지 URL> --cw 100 --sref <시트 URL>`
   - ③ 각 프롬프트에 **캐릭터 설명 블록을 매번 그대로 붙여넣기** (생략하면 얼굴이 바뀝니다)
3. **크기**: 가로형 **3:2** (1536×1024). ChatGPT는 "landscape", Midjourney는 `--ar 3:2`
4. **파일 이름**: `step1-1.png`, `step1-2.png` … `step4-3.png` 로 저장해서 주세요.

---

## 공통 블록 (모든 프롬프트 끝에 붙이기)

### 🎨 스타일 블록
```
Korean webtoon style comic panel, clean confident line art, soft cel shading,
flat pastel colors with emerald green (#059669) accents, warm and humorous tone,
very expressive faces, simple uncluttered background, consistent character
design across panels, NO text, NO letters, NO numbers, NO speech bubbles,
NO logos, keep the top 25% of the frame as calm empty space for a speech
bubble to be added later, 3:2 landscape
```

### 👥 캐릭터 블록 (등장하는 인물만 골라 붙이기)
```
[OWNER] Mrs. Kim, a Korean woman in her early 40s who runs a small
neighborhood snack restaurant; short black bob hair, round friendly face,
small round glasses, emerald green apron over a cream long-sleeve shirt with
rolled-up sleeves.

[SALESMAN] a slick marketing-agency salesman in his 30s, navy suit, slicked-back
hair, oversized confident grin, shiny black briefcase.

[SPROUT] "Saessak", a tiny cute mascot shaped like a two-leaf green sprout
growing from a round white head with dot eyes and rosy cheeks, about the size
of a teacup, floats in the air with small sparkles.
```

> 새싹(Saessak)은 사이트 로고의 새싹 모양을 캐릭터로 만든 것입니다 → 3·4단계에서
> "마케팅방주"를 대신해 등장합니다.

---

## 0. 캐릭터 시트 (제일 먼저 1장)

```
Character reference sheet for a Korean webtoon: three characters standing side
by side on a plain white background, each shown front view and 3/4 view with
three facial expressions (happy, frustrated, surprised).
[OWNER] Mrs. Kim, a Korean woman in her early 40s who runs a small
neighborhood snack restaurant; short black bob hair, round friendly face,
small round glasses, emerald green apron over a cream long-sleeve shirt with
rolled-up sleeves.
[SALESMAN] a slick marketing-agency salesman in his 30s, navy suit, slicked-back
hair, oversized confident grin, shiny black briefcase.
[SPROUT] "Saessak", a tiny cute mascot shaped like a two-leaf green sprout
growing from a round white head with dot eyes and rosy cheeks, about the size
of a teacup, floats in the air with small sparkles.
Clean line art, soft cel shading, flat pastel colors with emerald green
(#059669) accents, NO text, NO letters, NO labels.
```

---

## 1단계 — "대행사에 300만 원 냈는데, 남은 건 캡처 몇 장"
분위기: 기대 → 허탈 → 어이없음. 어둡지 않게, 코믹하게.

### 1-1 · 달콤한 계약
💬 영업맨: "한 달이면 첫 페이지 보장합니다!" / 사장님: "정말요?!"
```
Inside a small cozy Korean snack restaurant, the SALESMAN leans across the
counter holding out a glossy contract that shines like treasure, confident
grin and thumbs up. Mrs. Kim (OWNER) clasps her hands with sparkling hopeful
eyes. Bright, slightly exaggerated "too good to be true" mood.
+ [OWNER] + [SALESMAN] + 스타일 블록
```

### 1-2 · 한 달 뒤, 보고서
💬 사장님: "…이게 300만 원어치라고?"
```
Night in the same restaurant after closing, chairs on tables. Mrs. Kim
(OWNER) sits alone at a table in front of a laptop, jaw dropped, deadpan
empty stare. The laptop screen shows only a few blurry screenshots and a
meaningless little chart. A tall stack of paid invoices sits beside her.
A single hanging lamp lights the scene. Comedic disbelief, not sad.
+ [OWNER] + 스타일 블록
```

### 1-3 · "진행 중입니다~"
💬 전화 속 영업맨: "진행 중입니다~" / 사장님: "그냥 해지할게요" / 영업맨: "약정 6개월 남으셨는데요^^"
```
Split composition. Left: Mrs. Kim (OWNER) on the phone, vein popping on her
forehead, eye twitching. Right: the SALESMAN in a tiny inset bubble-shaped
frame, smiling sweetly while holding up the contract, which is wrapped in a
heavy cartoon chain and a big padlock. Comedic frustration.
+ [OWNER] + [SALESMAN] + 스타일 블록
```

---

## 2단계 — "견적은 부르는 게 값"
분위기: 혼란 → 불안.

### 2-1 · 세 업체, 세 가격
💬 사장님: "같은 작업인데요…?"
(가격표 위 "80만 / 150만 / 50만"은 제가 코드로 얹습니다)
```
Mrs. Kim (OWNER) stands in her restaurant doorway, facing three different
salespeople lined up in a row, each holding up a blank price placard of a
very different size: one medium, one huge, one small. Mrs. Kim tilts her head
with a big question mark feeling, eyebrows raised.
+ [OWNER] + 스타일 블록
```

### 2-2 · 견적 룰렛
💬 사장님: "뭐가 맞는 거야…"
```
Imaginative comic scene: Mrs. Kim (OWNER) spins dizzily in the middle of a
giant casino roulette wheel, blank price cards and coins flying around her,
spiral eyes, apron flapping. Playful chaotic energy, bright colors.
+ [OWNER] + 스타일 블록
```

### 2-3 · 새벽 2시의 불안
💬 사장님: "혹시 나… 호구 잡힌 건가?"
```
Late at night, Mrs. Kim (OWNER) lies in bed under a blanket, face lit by her
smartphone screen, eyes wide open and sweating nervously. A small thought
cloud shows a cartoon fishing hook dangling above her head. Dim blue room,
soft comedic worry.
+ [OWNER] + 스타일 블록
```

---

## 3단계 — 반전: "할 수 있는 건 다 있고, 가격은 원가에 딱"
분위기: 번쩍! → 시원·통쾌 → 믿기지 않는 기쁨. 색감 확 밝게.

### 3-1 · 새싹 등장
💬 새싹: "사장님, 이제 이렇게 해보세요!"
```
Morning light bursts as Saessak (SPROUT) pops up from a small potted plant on
the restaurant counter, surrounded by sparkles, arms wide. Mrs. Kim (OWNER),
holding a coffee mug, leans back in surprise with wide eyes. Fresh bright
atmosphere, sense of a turning point.
+ [OWNER] + [SPROUT] + 스타일 블록
```

### 3-2 · 투명한 진열장, 거품 빼기
💬 새싹: "대행사가 하는 건 전부 있고, 거품은 싹 뺐어요"
```
A bright clean glass display shelf filled with cute marketing icons, each on
its own small stand with a tiny blank price tag: a map pin, a pencil and
notebook, a camera, a play button, a megaphone, a folded newspaper, and a
sparkle star. Saessak (SPROUT) happily pops big floating soap bubbles in front
of the shelf with a tiny pin, the bubbles bursting into confetti. Transparent,
abundant, satisfying mood.
+ [SPROUT] + 스타일 블록
```

### 3-3 · 약정 사슬 끊기
💬 사장님: "1건부터? 약정도 없다고요?!" / 새싹: "필요한 만큼만!"
```
Mrs. Kim (OWNER) holds a magnifying glass up to a tiny blank price tag, her
eyes huge and shining with delight. Behind her, the heavy chain and padlock
from before snaps and falls apart into pieces. Saessak (SPROUT) floats beside
her giving a proud thumbs up. Triumphant, joyful.
+ [OWNER] + [SPROUT] + 스타일 블록
```

---

## 4단계 — "이제 사장님 차례예요" (승선)
분위기: 가뿐함 → 자신감 → 출항. 브랜드 모티프(방주 = 배)로 마무리.

### 4-1 · 가입 3분
💬 사장님: "가입 3분, 가입비 0원이라고?"
```
Mrs. Kim (OWNER) sits relaxed at her counter tapping her smartphone with one
finger, a small cartoon stopwatch floating nearby showing a quick lap. A
steaming cup of tea beside her. Saessak (SPROUT) peeks over the phone
cheering. Easy, light, cheerful.
+ [OWNER] + [SPROUT] + 스타일 블록
```

### 4-2 · 필요한 것만 톡
💬 사장님: "필요한 것만 골라서, 클릭 한 번!"
```
Over-the-shoulder view of Mrs. Kim (OWNER) holding her phone. From the phone
screen, a row of cute marketing icon cards (map pin, pencil, camera, play
button, megaphone) fans out into the air like a magic menu. She taps one
card and it glows emerald green. Saessak (SPROUT) catches it happily.
Satisfying, simple, in-control feeling.
+ [OWNER] + [SPROUT] + 스타일 블록
```

### 4-3 · 출항
💬 사장님: "이제 내 가게 마케팅은 내가 직접!"
```
Wide heroic shot: Mrs. Kim (OWNER), still in her emerald apron, stands
confidently at the helm of a friendly small green ark-shaped boat, one hand
on the ship's wheel. A glowing dashboard screen on the deck shows a rising
line chart. Saessak (SPROUT) rides on top of the mast like a flag. Calm sea,
sunrise, and in the distance her small restaurant on the shore with a line of
happy customers. Hopeful, triumphant ending.
+ [OWNER] + [SPROUT] + 스타일 블록
```

---

## 대사 한눈에 보기 (제가 말풍선으로 얹을 내용 — 수정 원하면 여기서)

| 컷 | 대사 |
|---|---|
| 1-1 | 영업맨 "한 달이면 첫 페이지 보장합니다!" · 사장님 "정말요?!" |
| 1-2 | 사장님 "…이게 300만 원어치라고?" |
| 1-3 | 전화 "진행 중입니다~" · 사장님 "그냥 해지할게요" · 영업맨 "약정 6개월 남으셨는데요^^" |
| 2-1 | 사장님 "같은 작업인데요…?" (가격표: 80만 / 150만 / 50만) |
| 2-2 | 사장님 "뭐가 맞는 거야…" |
| 2-3 | 사장님 "혹시 나… 호구 잡힌 건가?" |
| 3-1 | 새싹 "사장님, 이제 이렇게 해보세요!" |
| 3-2 | 새싹 "대행사가 하는 건 전부 있고, 거품은 싹 뺐어요" |
| 3-3 | 사장님 "1건부터? 약정도 없다고요?!" · 새싹 "필요한 만큼만!" |
| 4-1 | 사장님 "가입 3분, 가입비 0원이라고?" |
| 4-2 | 사장님 "필요한 것만 골라서, 클릭 한 번!" |
| 4-3 | 사장님 "이제 내 가게 마케팅은 내가 직접!" |

> ⚠️ 1-1의 "첫 페이지 보장"은 **대행사의 과장 영업을 풍자하는 대사**입니다.
> 우리 상품 설명으로 오해받지 않도록 영업맨 캐릭터에게만 둡니다.

---

## 받은 뒤 적용 (제가 할 일)

1. 12컷을 `public/onboarding/comic/step1-1.png` … 에 저장 (WebP로 압축, 컷당 ~100KB 목표)
2. 온보딩 화면을 **웹툰 세로 스크롤**로 변경: 단계마다 3컷을 위아래로 이어 붙이고,
   컷 위에 말풍선(HTML)으로 대사 표시 → 그 아래 기존 제목·설명·버튼
3. 이미지가 로딩되기 전/실패 시에는 지금의 이모지 화면으로 자동 대체

## 생성 팁
- 한 컷이 마음에 안 들면 **그 컷만** 다시 뽑으면 됩니다 (대사는 코드라 영향 없음)
- 글자가 조금이라도 들어가면 다시 뽑거나 지워주세요 (간판·화면 속 글자 포함)
- 얼굴이 달라지면: 캐릭터 시트를 다시 참고로 붙이고 "same face as the reference" 추가
