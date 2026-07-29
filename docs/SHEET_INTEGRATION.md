# 스프레드시트 연동 가이드 — 단가 실시간 조정 + 문의 접수(시트 기재+메일)

Google 스프레드시트 하나로 두 가지를 운영합니다. 코드 배포 없이 시트만 고치면
사이트 단가가 바뀌고, 문의는 시트에 쌓이면서 메일로도 날아옵니다. (무료)

---

## 1️⃣ 단가 시트 — 시트에서 고치면 사이트에 반영

### 시트 만들기
1. https://sheets.google.com 에서 새 스프레드시트 생성, 이름: `마케팅방주 단가표`
2. 첫 번째 탭 이름을 `prices` 로 바꾸고 1행에 헤더 입력:

   | group | name | price | unit | amountKrw | note | inquiry | hide |
   |---|---|---|---|---|---|---|---|

3. **바꾸고 싶은 상품만** 행으로 추가하면 됩니다 (전부 옮길 필요 없음).
   - `group`: 그룹 키 — `blog` `reward` `place` `cafe` `ai` `sns` `kakaomap` `daangn` `press`
   - `name`: 사이트 단가표의 상품명과 **정확히 동일**하게 (예: `쿠팡 가구매`)
   - `price`: 표시 가격 (예: `1,800원`) / `amountKrw`: 주문 결제 금액 숫자 (예: `1800`)
   - `note`: 안내 문구 / `inquiry`: `1`이면 견적·문의로 전환 / `hide`: `1`이면 사이트에서 숨김
   - 사이트에 없는 새 `name`을 쓰면 **신규 항목으로 추가**됩니다

   예시 (쿠팡 가구매를 1,800원으로 올리는 경우):
   | group | name | price | unit | amountKrw | note |
   |---|---|---|---|---|---|
   | reward | 쿠팡 가구매 | 1,800원 | 1건 | 1800 | 실구매 리워드 진행 · 증빙처리 가능! |

### 게시하기 (CSV 링크 발급)
1. 파일 → **공유 → 웹에 게시**
2. 대상: `prices` 시트 선택, 형식: **쉼표로 구분된 값(.csv)** → 게시
3. 나온 링크 복사 (예: `https://docs.google.com/spreadsheets/d/e/…/pub?gid=0&single=true&output=csv`)

### 사이트에 연결
GitHub 레포 → Settings → Secrets and variables → **Actions → Variables**:
- `NEXT_PUBLIC_PRICE_SHEET_CSV_URL` = 위 CSV 링크

배포(Re-run) 후부터는 **시트만 수정하면 끝** — 방문자가 단가표를 열 때마다
시트 값을 읽어 덮어씁니다. (구글 게시 캐시 때문에 반영까지 최대 ~5분)
시트가 죽거나 비어 있으면 자동으로 코드 내장 단가로 동작하니 안전합니다.

---

## 2️⃣ 문의 접수 — 시트 기재 + 메일 발송

### 접수 시트 준비
같은 스프레드시트에 두 번째 탭 `inquiries` 를 만들고 1행에:

| 접수시각 | 이름 | 연락처 | 이메일 | 주제 | 내용 | 페이지 |
|---|---|---|---|---|---|---|

### Apps Script 붙여넣기
1. 스프레드시트에서 **확장 프로그램 → Apps Script**
2. 아래 코드를 통째로 붙여넣기 (기존 내용 삭제):

```js
// 마케팅방주 문의 웹훅: 시트 기재 + 메일 발송
const OWNER_EMAIL = "cccompanymaster@gmail.com"; // 받을 메일 주소
const SHEET_NAME = "inquiries";

function doPost(e) {
  const p = (e && e.parameter) || {};
  const row = [
    new Date(),
    p.name || "",
    p.contact || "",
    p.email || "",
    p.topic || "",
    p.message || "",
    p.page || "",
  ];

  // 1) 시트에 기재
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.appendRow(row);

  // 2) 메일 발송
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: "[마케팅방주 문의] " + (p.topic || "일반") + " — " + (p.name || "무기명"),
    body:
      "이름: " + p.name + "\n" +
      "연락처: " + p.contact + "\n" +
      "이메일: " + (p.email || "-") + "\n" +
      "주제: " + p.topic + "\n" +
      "페이지: " + (p.page || "-") + "\n\n" +
      p.message,
  });

  return ContentService.createTextOutput("ok");
}
```

3. `OWNER_EMAIL` 이 맞는지 확인 후 저장

### 웹 앱으로 배포
1. 우측 상단 **배포 → 새 배포**
2. 유형: **웹 앱** / 실행 계정: **나** / 액세스 권한: **모든 사용자** ← 중요
3. 배포 → 권한 승인(내 계정 허용) → **웹 앱 URL** 복사
   (예: `https://script.google.com/macros/s/AKfy…/exec`)

### 사이트에 연결
GitHub Variables에 추가:
- `NEXT_PUBLIC_INQUIRY_WEBHOOK_URL` = 위 웹 앱 URL

배포 후 `/pricing`의 **[문의]** 버튼과 **[견적·문의하기]** 버튼이 문의 폼으로
열리고, 제출 즉시 `inquiries` 탭에 쌓이면서 메일이 도착합니다.
웹훅 미설정 상태에서는 방문자의 메일 앱이 열리는 fallback 으로 동작합니다.

---

## ✅ 체크리스트 요약
- [ ] 시트 생성 (`prices` + `inquiries` 탭)
- [ ] `prices` 웹에 게시(CSV) → `NEXT_PUBLIC_PRICE_SHEET_CSV_URL` 등록
- [ ] Apps Script 붙여넣기 → 웹 앱 배포(모든 사용자) → `NEXT_PUBLIC_INQUIRY_WEBHOOK_URL` 등록
- [ ] Actions Re-run → `/pricing`에서 "실시간 단가 반영 중" 배지 + 문의 폼 확인
