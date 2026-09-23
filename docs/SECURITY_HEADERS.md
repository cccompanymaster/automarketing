# 보안 헤더 / CSP 적용 가이드 (Cloudflare)

정적 export(GitHub Pages)는 응답 헤더를 설정할 수 없습니다. 도메인을 **Cloudflare**
프록시 뒤에 두고, Cloudflare에서 보안 헤더를 주입합니다. (GitHub Pages는 그대로 유지)

> **순서 주의**: GitHub Pages에서 **Enforce HTTPS가 켜진 뒤에** 진행하세요.
> 그 전에 프록시(주황 구름)를 켜면 GitHub이 인증서를 발급하지 못합니다.

## 이 사이트가 사용하는 외부 출처

CSP는 아래 출처만 허용합니다. 코드(`src/`)와 배포 변수로 연결되는 외부 서비스를
대조해 작성했습니다. **새 외부 서비스를 붙이면 여기에도 추가해야** 브라우저가
차단하지 않습니다.

| 용도 | 출처 | CSP 항목 |
|---|---|---|
| Pretendard 폰트/CSS | `cdn.jsdelivr.net` | style-src, font-src |
| 인증·캐시·주문·AI 원고 | `*.supabase.co` (+ `wss://`) | connect-src |
| 단가 스프레드시트(CSV) | `docs.google.com` → `*.googleusercontent.com` | connect-src |
| 상담 문의 시트(Apps Script) | `script.google.com` → `*.googleusercontent.com` | connect-src |
| 결제(PortOne) SDK·API·결제창 | `cdn.portone.io`, `*.portone.io`, `*.iamport.co` | script-src, connect-src, frame-src |
| GTM (GA4 + Meta Pixel) | `www.googletagmanager.com` 외 | script/img/connect/frame-src |
| 카카오 로그인 | `kauth.kakao.com` | (페이지 이동 방식이라 CSP 대상 아님) |

> **결제 주의**: PG사(토스페이먼츠·KG이니시스 등)를 확정하면 결제창이 해당 PG 도메인을
> 추가로 띄울 수 있습니다. 결제 테스트 때 콘솔에 CSP 차단이 보이면 그 도메인을
> `frame-src`에 추가하세요.

## 넣을 헤더 (복사용)

| 헤더 이름 | 값 |
|---|---|
| `Content-Security-Policy` | 아래 한 줄 전체 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` |

**Content-Security-Policy 값** (한 줄로 그대로 복사):

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://cdn.portone.io; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net data:; img-src 'self' data: blob: https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://*.g.doubleclick.net; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://docs.google.com https://script.google.com https://*.googleusercontent.com https://*.portone.io https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://www.facebook.com; frame-src https://www.googletagmanager.com https://td.doubleclick.net https://*.portone.io https://*.iamport.co; upgrade-insecure-requests
```

> **`script-src 'unsafe-inline'`**: GTM은 인라인 부트스트랩 스크립트를 쓰고 태그를
> 동적으로 주입하므로 nonce 기반 엄격 CSP를 적용하기 어렵습니다. 추후 서버 사이드
> 태깅으로 옮길 때 조여주세요.
>
> **HSTS에 `preload`를 넣지 않은 이유**: preload 목록에 한 번 등록되면 되돌리는 데
> 수개월이 걸립니다. 운영이 안정된 뒤 필요하면 추가하세요.

## 설정 절차 (Cloudflare Free 플랜 기준)

### 1) SSL/TLS 모드
Cloudflare → **SSL/TLS → Overview** → **Full (strict)**
(GitHub Pages 인증서가 발급된 상태라 strict가 가능합니다. **Flexible은 무한
리다이렉트가 나니 절대 선택하지 마세요.**)

### 2) 프록시 켜기
**DNS → Records** → 레코드 5개(A 4개 + www CNAME)의 구름을 **주황색(Proxied)** 으로 전환
→ 사이트 접속해서 정상인지 확인

### 3) 보안 헤더 넣기 — Transform Rules (무료 플랜 가능)
1. **Rules → Overview → Create rule → Response Header Transform Rule**
   (메뉴 이름이 다르면: Rules → Transform Rules → Modify Response Header)
2. Rule name: `security-headers`
3. If incoming requests match… → **All incoming requests**
4. Then… → **Set static** 선택 → 위 표의 헤더 이름·값 입력
5. **+ Set new header** 로 6개 모두 추가
6. **Deploy**

### (유료 플랜이면) 대안 — Snippet
Pro 이상 플랜이면 **Rules → Snippets** 에서 코드로 관리할 수도 있습니다.

```js
export default {
  async fetch(request) {
    const res = await fetch(request);
    const h = new Headers(res.headers);
    h.set("Content-Security-Policy", "<위 CSP 한 줄 그대로>");
    h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    h.set("X-Content-Type-Options", "nosniff");
    h.set("X-Frame-Options", "DENY");
    h.set("Referrer-Policy", "strict-origin-when-cross-origin");
    h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
    return new Response(res.body, { status: res.status, headers: h });
  },
};
```

## 검증
1. https://securityheaders.com 에 `https://selfmarketing.ai.kr` 입력 → 목표 **A 이상**
2. 사이트에서 **F12 → Console** 열고 홈 / 로그인 / 회원가입 / 마이페이지를 한 번씩 이동
3. 빨간 글씨로 `Refused to ... because it violates the Content Security Policy` 가
   보이면 캡처해서 전달 → 해당 출처를 추가합니다

## 문제가 생기면 (즉시 되돌리기)
- 사이트 일부가 안 되면: Transform Rule의 **토글을 OFF** → 즉시 원상복구
- 사이트 전체가 안 열리면: DNS 레코드를 다시 **회색 구름** 으로 → GitHub 직결로 복구
