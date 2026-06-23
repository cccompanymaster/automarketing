# AI 블로그 원고 작성 — 실제 연동 가이드

마이페이지 또는 상품·요금의 **「AI 작성」** → `/tools/blog-writer` 에서 사용합니다.
3단계: **주제 설정 → 아웃라인 구성 → 글쓰기 완료**.

## 동작 방식
| 상태 | 생성 |
|---|---|
| API 미설정 (현재) | 데모(샘플) 원고 — 즉시 동작 |
| API 설정 시 | 실제 Claude 원고 (서버 프록시 경유) |

정적 사이트(GitHub Pages)라 **API 키를 클라이언트에 둘 수 없어** 서버(Supabase Edge Function)에서 생성합니다.

## 1. Edge Function 배포
```bash
supabase functions deploy blog-writer --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...        # 서버 전용(노출 금지)
# (선택) 비용 절감용으로 모델 변경 — 기본은 claude-opus-4-8
supabase secrets set BLOG_MODEL=claude-sonnet-4-6
```
함수 코드: `supabase/functions/blog-writer/index.ts` (Anthropic SDK 사용).

## 2. 클라이언트 환경변수
배포 빌드 env(및 `.env.local`)에 함수 URL을 넣으면 자동으로 실제 모드 전환:
```
NEXT_PUBLIC_BLOG_API_URL=https://<project>.supabase.co/functions/v1/blog-writer
```
> GitHub Pages 배포 시 `.github/workflows/deploy.yml` build 단계 env에도 추가하세요.

## 3. 권장 보안/운영(연동 시)
- `// TODO(auth)` 지점에서 Supabase JWT 검증 + 사용자별 레이트리밋/크레딧 확인
- 원고 생성은 클라이언트에서 캐시 1,000 차감(원고 작성 단가와 동일) — 실제 과금은 서버 검증 권장
- 모델 기본값 `claude-opus-4-8`. 대량 생성은 `claude-sonnet-4-6` 등으로 비용 조정 가능

## 참고
- 클라이언트 진입점: `src/lib/blogWriter.ts` (titles/outline/article)
- UI: `src/components/BlogWriter.tsx`, 페이지: `src/app/tools/blog-writer/page.tsx`
