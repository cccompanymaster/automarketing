# 카카오 · 네이버 로그인 연결

코드와 서버 준비는 끝났습니다. 아래는 **사장님이 콘솔에서 하실 일**입니다.
각 로그인은 마지막에 GitHub 변수를 `true`로 바꿔야 버튼이 나타납니다.
(켜기 전에는 버튼이 숨겨져 있어서 방문자가 오류 화면을 볼 일이 없습니다.)

## 구조 (참고)

| | 카카오 | 네이버 |
|---|---|---|
| Supabase 지원 | 기본 지원 | 미지원 → **Custom OAuth 공급자**로 추가 |
| 추가 서버 | 없음 | `naver-userinfo` Edge Function (배포 완료) |
| 로그인 후 돌아오는 곳 | `/auth/callback/` | `/auth/callback/` |
| 켜는 스위치 | `NEXT_PUBLIC_KAKAO_LOGIN_ENABLED` | `NEXT_PUBLIC_NAVER_LOGIN_ENABLED` |

네이버는 회원정보를 `response` 안에 한 번 더 감싸서 보내서 Supabase가 이메일을
못 읽습니다. `naver-userinfo` 함수가 중간에서 표준 형식(sub, email)으로 풀어줍니다.
비밀키는 없고, 로그인한 본인의 네이버 토큰으로 본인 정보만 조회합니다.

**동의 기록**: 소셜 가입은 약관 체크 후 버튼을 누르면 그 선택이 그대로 기록되고,
체크 없이 누르거나 로그인 화면에서 처음 들어온 경우엔 로그인 직후 **약관 동의
화면**이 뜹니다. 이메일 인증 대기로 기록이 빠졌던 기존 가입자도 다음 로그인 때
자동으로 기록됩니다.

---

## A. 카카오 (약 20분)

### 1) 카카오 앱 만들기
https://developers.kakao.com → 로그인 → **내 애플리케이션 → 애플리케이션 추가하기**
- 앱 이름: `마케팅방주` / 회사명: `씨씨컴퍼니` / 카테고리: 비즈니스 → 저장

### 2) 키 2개 복사 + 리다이렉트 URI 등록
**앱 설정 → 앱 → 플랫폼 키 → REST API 키** 클릭
- **REST API 키** 복사 → Supabase의 *Client ID*
- **카카오 로그인 리다이렉트 URI** 에 아래 입력 → 저장
  ```
  https://weytdwzwviamqrtzrjmg.supabase.co/auth/v1/callback
  ```
- 같은 화면의 **카카오 로그인 Client Secret** 코드 복사 → Supabase의 *Client Secret*,
  그리고 **활성화** 상태로

### 3) 카카오 로그인 켜기 + 이메일 받기
- **제품 설정 → 카카오 로그인 → 일반 → 사용 설정: ON**
- **이메일을 받으려면 비즈 앱 전환이 필요합니다**: 앱 설정 → 앱 → 일반 →
  **비즈니스 정보**에 사업자등록번호(`275-05-01613`) 입력
- **제품 설정 → 카카오 로그인 → 동의항목**
  - 닉네임, 프로필 사진: 필수 또는 선택
  - **카카오계정(이메일): 필수 동의**

> 이메일이 꼭 필요한 이유: 관리자 페이지에서 원고 같은 산출물을 **회원 이메일로
> 찾아서** 올립니다. 이메일 없는 카카오 회원에게는 산출물을 보낼 수 없습니다.

### 4) Supabase에 입력
https://supabase.com/dashboard/project/weytdwzwviamqrtzrjmg/auth/providers
→ **Kakao** 펼치기 → **Enable** 켜기 → Client ID / Client Secret 붙여넣기 → **Save**

### 5) 버튼 켜기
https://github.com/cccompanymaster/automarketing/settings/variables/actions
→ `NEXT_PUBLIC_KAKAO_LOGIN_ENABLED` = `true` →
https://github.com/cccompanymaster/automarketing/actions/workflows/deploy.yml → **Run workflow**

---

## B. 네이버 (약 30분 + 검수 대기)

### 1) Supabase 콜백 주소 먼저 복사 (아직 저장하지 않음)
https://supabase.com/dashboard/project/weytdwzwviamqrtzrjmg/auth/providers
→ **Custom OAuth Providers → New Provider → Manual configuration**
→ 화면에 표시되는 **Callback URL** 을 복사해 두세요. (창은 열어둔 채로)

### 2) 네이버 앱 등록
https://developers.naver.com/apps/#/register
- 애플리케이션 이름: `마케팅방주`
- 사용 API: **네이버 로그인**
- 제공 정보 선택: **이메일 주소 (필수)**, 별명·이름·프로필 사진 (선택)
- 로그인 오픈 API 서비스 환경: **PC 웹**
  - 서비스 URL: `https://selfmarketing.ai.kr`
  - Callback URL: 1)에서 복사한 주소
- 등록 → **Client ID / Client Secret** 복사

### 3) Supabase에 네이버 공급자 추가 (1)의 창으로 돌아가서)
| 칸 | 값 |
|---|---|
| Identifier | `custom:naver` ← **정확히 이대로** (코드가 이 이름을 씁니다) |
| Name | `네이버` |
| Client ID / Client Secret | 2)에서 복사한 값 |
| Authorization URL | `https://nid.naver.com/oauth2.0/authorize` |
| Token URL | `https://nid.naver.com/oauth2.0/token` |
| UserInfo URL | `https://weytdwzwviamqrtzrjmg.supabase.co/functions/v1/naver-userinfo` |
| Scopes | 비워두기 (필수 입력이면 `profile`) |

→ **Create and enable provider**

### 4) 테스트 후 버튼 켜기
- `NEXT_PUBLIC_NAVER_LOGIN_ENABLED` = `true` 등록 → Run workflow
- 사장님 네이버 계정으로 로그인 테스트

> ⚠️ **네이버 검수**: 등록 직후 네이버 앱은 **"개발 중"** 상태라 **앱 관리자와 등록한
> 테스터만** 로그인됩니다. 일반 방문자에게 열려면 네이버 개발자센터에서
> **검수 요청**(서비스 설명·화면 캡처 제출, 보통 며칠 소요)을 통과해야 합니다.
> 검수 전에 버튼을 켜두면 일반 방문자는 네이버 화면에서 막히니, **테스트가 끝나면
> 변수를 다시 비워두고 검수 통과 후 켜는 것**을 권합니다.

### 문제가 생기면
- 네이버 로그인 후 오류가 나면: Supabase의 네이버 공급자 → Update → **PKCE 끄기**
  (네이버는 PKCE를 공식 지원하지 않습니다. 기본값으로 먼저 시도하세요)
- 이메일이 `@naver.com`이 아닌 회원은 첫 로그인 때 Supabase 확인 메일을 한 번 받습니다.
  네이버 소유가 확실하지 않은 이메일을 그대로 믿으면, 같은 이메일의 다른 계정과
  잘못 합쳐질 수 있어서 일부러 한 번 더 확인합니다.
