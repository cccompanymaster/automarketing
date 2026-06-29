# 보안 헤더 / CSP 적용 가이드 (Cloudflare)

정적 export(GitHub Pages)는 응답 헤더를 설정할 수 없습니다. 도메인을 **Cloudflare**
프록시 뒤에 두고, Cloudflare에서 보안 헤더를 주입합니다. (GitHub Pages는 그대로 유지)

## 이 사이트가 사용하는 외부 출처
CSP는 아래 출처만 허용하도록 작성했습니다. (GTM 컨테이너에 마케팅 태그를 추가하면
해당 출처를 CSP에 더 넣어야 합니다.)

| 용도 | 출처 |
|---|---|
| GTM (GA4 + Meta Pixel 컨테이너) | `https://www.googletagmanager.com` |
| GA4 수집 | `https://www.google-analytics.com`, `https://*.analytics.google.com`, `https://*.g.doubleclick.net` |
| Meta Pixel | `https://connect.facebook.net`(스크립트), `https://www.facebook.com`(픽셀 이미지) |
| Pretendard 폰트/CSS | `https://cdn.jsdelivr.net` |
| 인증·캐시·AI 백엔드 | `https://*.supabase.co` |

## 권장 응답 헤더

```
Content-Security-Policy:
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  form-action 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net;
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  font-src 'self' https://cdn.jsdelivr.net data:;
  img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://*.g.doubleclick.net;
  connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net;
  frame-src https://www.googletagmanager.com https://td.doubleclick.net;
  upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
```

> **`script-src 'unsafe-inline'` 참고**: GTM은 인라인 부트스트랩 스크립트를 쓰고 태그를
> 동적으로 주입하므로 nonce 기반 엄격 CSP를 적용하기 어렵습니다. 우선 `'unsafe-inline'`로
> 시작하고, 추후 GTM을 nonce/서버 사이드 태깅으로 옮길 때 조여주세요.
> 카카오 OAuth는 팝업이 아닌 리다이렉트 방식이라 `frame-ancestors 'none'`과 충돌하지 않습니다.

## 설정 절차

### 1) 도메인을 Cloudflare에 연결
1. Cloudflare에 사이트(도메인) 추가 → 안내된 네임서버로 변경
2. GitHub Pages 커스텀 도메인 연결: 레포 **Settings → Pages → Custom domain**에 도메인 입력
   (레포 루트에 `CNAME` 파일이 생성됩니다)
3. DNS: `CNAME @ <username>.github.io` (또는 GitHub Pages A 레코드) — **프록시 상태 ON(주황 구름)**
4. SSL/TLS 모드: **Full** 이상

### 2) 보안 헤더 주입 — 방법 A: Snippet (권장, 한 곳에서 관리)
Cloudflare 대시보드 → **Rules → Snippets** → 새 Snippet 생성 후 아래 코드 사용:

```js
export default {
  async fetch(request) {
    const res = await fetch(request);
    const h = new Headers(res.headers);
    h.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "font-src 'self' https://cdn.jsdelivr.net data:",
        "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://*.g.doubleclick.net",
        "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net",
        "frame-src https://www.googletagmanager.com https://td.doubleclick.net",
        "upgrade-insecure-requests",
      ].join("; "),
    );
    h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    h.set("X-Content-Type-Options", "nosniff");
    h.set("X-Frame-Options", "DENY");
    h.set("Referrer-Policy", "strict-origin-when-cross-origin");
    h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
    return new Response(res.body, { status: res.status, headers: h });
  },
};
```

### 2) 보안 헤더 주입 — 방법 B: Transform Rules (노코드)
**Rules → Transform Rules → Modify Response Header → Set static**로 위 표의 헤더를
하나씩 추가합니다. (CSP는 한 줄로 합쳐 입력)

## 검증
- 배포 후 `curl -sI https://<도메인>` 으로 헤더 확인
- https://securityheaders.com 에서 등급 확인 (목표 A 이상)
- 브라우저 콘솔에 CSP 위반(blocked) 로그가 없는지 확인 — 있으면 해당 출처를 CSP에 추가
