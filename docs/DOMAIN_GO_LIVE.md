# selfmarketing.ai.kr 연결 → 오픈까지, 순서대로

도메인 구매 이후 **사장님이 직접 하실 일**만 순서대로 적었습니다.
순서가 중요합니다. 도메인이 확정돼야 인증·검색엔진·보안헤더가 전부 새 주소로 붙습니다.

- **도메인**: `selfmarketing.ai.kr`
- `ai.kr` 은 공인 2차 도메인(public suffix)이라 Cloudflare 무료 플랜에 그대로 등록됩니다.
  일반 `.com` 과 설정 방법이 같습니다.

## 코드 쪽은 준비 완료 (제가 처리함)

배포 워크플로에 `PAGES_CUSTOM_DOMAIN` 변수 스위치를 넣었습니다. 이 변수를 등록하면
그 순간부터:

- 빌드 결과물에 `CNAME` 파일이 자동 생성됩니다
  (이 배포는 `out/` 폴더를 통째로 올리는 방식이라, 저장소가 아니라 **빌드 결과물 안에**
  CNAME이 있어야 합니다. 없으면 배포할 때마다 커스텀 도메인이 풀립니다.)
- 주소에서 `/automarketing` 이 사라지고 도메인 루트 기준으로 빌드됩니다
- 사이트맵·canonical·구조화 데이터가 전부 `https://selfmarketing.ai.kr` 로 바뀝니다

> **변수를 등록하기 전까지는 아무것도 바뀌지 않습니다.** 그래서 DNS를 먼저 걸고
> 마지막에 스위치를 켜는 순서가 가능합니다. (거꾸로 하면 DNS가 준비되기 전에
> 기존 주소가 새 도메인으로 리다이렉트되면서 사이트가 잠깐 죽습니다.)

---

## 1단계. Cloudflare에 도메인 등록 — 10분 + 전파 대기

1. Cloudflare 가입 → **Add a site** → `selfmarketing.ai.kr` 입력 → **Free** 플랜
2. Cloudflare가 알려주는 **네임서버 2개**를 복사
3. 도메인 구매처(가비아/후이즈 등) 접속 → **네임서버 변경** → Cloudflare 네임서버로 교체
4. 반영까지 보통 10분~2시간(최대 24시간). Cloudflare 대시보드가 **Active** 로 바뀌면 완료

---

## 2단계. DNS 레코드 추가 — 단, **회색 구름(DNS only)** 으로 — 5분

Cloudflare → **DNS → Records** 에서 추가합니다.

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `185.199.108.153` | **DNS only (회색)** |
| A | `@` | `185.199.109.153` | **DNS only (회색)** |
| A | `@` | `185.199.110.153` | **DNS only (회색)** |
| A | `@` | `185.199.111.153` | **DNS only (회색)** |
| CNAME | `www` | `cccompanymaster.github.io` | **DNS only (회색)** |

> ⚠️ **반드시 회색 구름으로 시작하세요.** 주황색(프록시 ON)이면 GitHub이 도메인
> 소유를 확인하지 못해 **HTTPS 인증서 발급이 실패**합니다. 인증서가 나온 뒤(4단계)
> 주황색으로 바꿉니다.
>
> `@` 는 `selfmarketing.ai.kr` 자체를 뜻합니다. Cloudflare에서 Name 칸에 `@` 를
> 입력하면 자동으로 도메인 전체 이름으로 표시됩니다.

---

## 3단계. 배포 스위치 켜기 (변수 등록) — 3분

GitHub → `cccompanymaster/automarketing` → Settings →
**Secrets and variables → Actions → Variables** 탭 → New repository variable

| 이름 | 값 |
|---|---|
| `PAGES_CUSTOM_DOMAIN` | `selfmarketing.ai.kr` |

**같이 등록하세요** (이게 실제 오픈의 핵심입니다 — 지금 사이트는 이 값이 없어서
가입·주문이 전부 가짜로 동작하는 stub 상태입니다):

| 이름 | 값 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://weytdwzwviamqrtzrjmg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_3xCJ6zbDDZ-fzrtKrh8dsg_mHNHAoyD` |
| `NEXT_PUBLIC_ADMIN_EMAILS` | `cccompanymaster@gmail.com` |

등록 후 → **Actions 탭 → 최근 워크플로 → Re-run all jobs**

> publishable 키는 공개용이라 저장소에 넣어도 안전합니다.
> **secret 키는 절대 여기 넣지 마세요.**

---

## 4단계. GitHub Pages 도메인 확인 + HTTPS — 5분 + 인증서 대기

1. GitHub → Settings → **Pages**
2. **Custom domain** 칸에 `selfmarketing.ai.kr` 이 이미 채워져 있을 겁니다
   (3단계 배포가 CNAME을 올리면 자동 인식). 비어 있으면 직접 입력 후 Save
3. "DNS check in progress" → 몇 분 뒤 체크 통과
4. **Enforce HTTPS** 체크박스가 활성화되면 **반드시 체크**
   (인증서 발급에 보통 5~30분, 길면 몇 시간)
5. `https://selfmarketing.ai.kr` 접속해서 사이트가 뜨는지 확인

---

## 5단계. Cloudflare 프록시 켜기 + 보안 헤더 — 15분

**4단계에서 HTTPS가 정상 동작한 뒤에** 진행하세요.

1. Cloudflare → **SSL/TLS → Overview** → 모드를 **Full** 로 설정
   (Flexible로 두면 무한 리다이렉트가 납니다)
2. DNS Records 로 돌아가 위 5개 레코드를 **주황색(Proxied)** 으로 전환
3. 도메인 재접속해서 정상인지 확인
4. 정상이면 `docs/SECURITY_HEADERS.md` 의 Snippet 코드를 Cloudflare →
   **Rules → Snippets** 에 등록
5. 브라우저 개발자도구 콘솔을 열고 사이트를 둘러보며 빨간 CSP 차단 오류가
   없는지 확인 (있으면 알려주세요, 제가 정책 수정)

---

## 6단계. Supabase 인증 주소 변경 — 5분

Supabase → 프로젝트 → **Authentication → URL Configuration**

- **Site URL**: `https://selfmarketing.ai.kr`
- **Redirect URLs** 에 추가: `https://selfmarketing.ai.kr/**`
  (기존 `https://cccompanymaster.github.io/automarketing/**` 는 당분간 같이 두세요)
- 카카오 로그인을 쓸 계획이면 카카오 개발자센터의 Redirect URI도 동일하게 갱신

> 이걸 안 하면 **가입 인증 메일 링크가 엉뚱한 주소로 갑니다.**

---

## 7단계. 데이터베이스 최신화 — 5분

Supabase → **SQL Editor** → `supabase/schema.sql` 전체 내용 붙여넣기 → **Run**

- "destructive operations" 경고가 나와도 그대로 진행하시면 됩니다
  (기존 데이터를 지우지 않고, 없는 것만 만드는 스크립트입니다)
- 실행 후 관리자 계정 등록:

```sql
insert into public.admin_users (email)
values ('cccompanymaster@gmail.com')
on conflict do nothing;
```

> 이걸 해야 **산출물 컨펌(원고 승인), 동의 이력 기록, 결제 적립** 테이블이 생깁니다.

---

## 8단계. 새 도메인에서 실제 테스트 — 10분

- [ ] 회원가입(전체 동의) → 인증 메일 수신 → 링크 클릭 → 정상 진입
- [ ] 로그아웃 → 로그인
- [ ] 상품·요금 메뉴 노출 (비회원일 땐 안 보이는 게 정상)
- [ ] 마이페이지 → 선택 동의 관리 토글
- [ ] 관리자 페이지 `/admin` 접근

문제가 있으면 화면 캡처해서 알려주세요.

---

## 9단계. 법적 필수 항목 — 오픈 전 반드시 ⚠️

- [ ] **제3자 제공 동의의 '제공받는 자'를 실제 제휴사 상호로 확정**
      → 지금은 초안 문구입니다. 미특정 상태로 DB를 제공하면 개인정보 보호법
      제17조 위반 소지가 있습니다. 명단을 알려주시면 제가 넣습니다.
- [ ] **통신판매업 신고번호** 취득 후 알려주기 (푸터 표기 의무)
      → 관할 구청 또는 정부24에서 신청
- [ ] **채팅에 노출된 Supabase secret 키 재발급**
      → Supabase → Settings → API Keys → 해당 키 Rotate

---

## 10단계. 검색 노출 등록 — 20분

- [ ] **Google Search Console** → 도메인 속성 등록(Cloudflare DNS로 인증) →
      `https://selfmarketing.ai.kr/sitemap.xml` 제출
- [ ] **네이버 서치어드바이저** → 사이트 등록 → 소유확인 → 사이트맵 제출
- [ ] 리치 결과 테스트 `search.google.com/test/rich-results` 로 FAQ·Service
      구조화 데이터 인식 확인

---

## 이후 (급하지 않음, 순서 무관)

| 항목 | 참고 문서 |
|---|---|
| 결제(PortOne) 연동 | `docs/PAYMENT_SETUP.md` |
| 단가 스프레드시트 + 문의 접수 시트 | `docs/SHEET_INTEGRATION.md` |
| 이미지 17장 제작 (온보딩4 + 상세13) | `docs/ONBOARDING_IMAGES.md`, `docs/DETAIL_IMAGES.md` |
| 인증 메일 한국어화 + 커스텀 SMTP | `docs/EMAIL_TEMPLATES.md` |
| AI 원고 작성 기능 활성화 | `ANTHROPIC_API_KEY` + Edge Function 배포 |
| GTM(광고 추적) 연결 | `NEXT_PUBLIC_GTM_ID` 변수 |

---

## 한눈에 보는 순서

```
1. Cloudflare 네임서버 변경           (대기 10분~2시간)
2. DNS 레코드 5개 — 회색 구름!
3. 변수 등록(PAGES_CUSTOM_DOMAIN + Supabase 3종) → Re-run
4. GitHub Pages 도메인 확인 + Enforce HTTPS   (대기 5~30분)
5. Cloudflare 프록시 ON + SSL Full + 보안헤더
6. Supabase 인증 주소 변경
7. schema.sql 실행 + 관리자 등록
8. 가입/로그인 실제 테스트
9. 제휴사 명단 + 통신판매업 신고번호 + 키 재발급
10. 검색엔진 등록
```
