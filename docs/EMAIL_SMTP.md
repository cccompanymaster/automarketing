# 인증 메일 발송 설정 (커스텀 SMTP) — ⚠️ 오픈 전 필수

## 왜 필요한가

Supabase 기본 메일 서버는 **Supabase 팀 멤버 이메일로만** 메일을 보냅니다.
그 외 주소는 `Email address not authorized` 로 거부됩니다(Supabase 공식 문서).
발송량도 시간당 몇 통 수준입니다.

→ 이 설정 전까지 **일반 고객은 가입 인증 메일도, 비밀번호 재설정 메일도 받지 못합니다.**
(사장님 이메일은 팀 멤버라 테스트할 때는 메일이 옵니다.)

## 추천: Resend (무료 월 3,000통 / 일 100통)

### 1) 가입 + 도메인 추가 — 10분
1. https://resend.com 가입
2. **Domains → Add Domain** → `selfmarketing.ai.kr`
   - Region: **Tokyo (ap-northeast-1)** (한국과 가장 가까움)
3. 표시되는 DNS 레코드를 Cloudflare에 추가
   - **Auto configure** (Cloudflare 자동 설정) 버튼이 보이면 그걸 누르는 게 가장 쉽습니다
   - 수동이면 Cloudflare → DNS → Records에 표시된 레코드(MX 1개, TXT 2개)를 그대로 추가
   - ⚠️ 이 레코드들은 **회색 구름(DNS only)** 이어야 합니다 (메일 레코드는 프록시 불가)
4. Resend 화면에서 **Verify** → 초록색 Verified 될 때까지 대기(보통 몇 분)

### 2) API 키 만들기 — 2분
**API Keys → Create API Key**
- Permission: **Sending access**
- Domain: `selfmarketing.ai.kr`
- 만들어진 키(`re_...`)를 복사 — **이 키는 비밀번호입니다. 채팅이나 코드에 붙여넣지 말고
  아래 Supabase 칸에만 넣으세요.**

### 3) Supabase에 연결 — 3분
https://supabase.com/dashboard/project/weytdwzwviamqrtzrjmg/auth/smtp
→ **Enable custom SMTP** 켜기

| 칸 | 값 |
|---|---|
| Sender email | `no-reply@selfmarketing.ai.kr` |
| Sender name | `마케팅방주` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | 2)에서 복사한 API 키 |

→ **Save**

### 4) 발송 한도 올리기 — 1분
https://supabase.com/dashboard/project/weytdwzwviamqrtzrjmg/auth/rate-limits
- **Rate limit for sending emails**: 기본값이 낮으면 `100` (시간당)으로

### 5) 메일 문구 한국어로 바꾸기 — 10분
`docs/EMAIL_TEMPLATES.md` 의 제목·본문을
https://supabase.com/dashboard/project/weytdwzwviamqrtzrjmg/auth/templates 에 붙여넣기
(최소: **Confirm signup**, **Reset password** 두 개)

### 6) 확인
- 사장님 것이 **아닌** 이메일(가족·지인 계정 등)로 새로 가입 → 인증 메일 수신 확인
- 스팸함으로 가면 Resend에서 도메인이 Verified인지 다시 확인
