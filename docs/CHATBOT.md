# 상담 챗봇 · AI 원고 (Ollama)

## 구성
- 화면: `src/components/ChatWidget.tsx` (모든 페이지 오른쪽 아래 `상담하기`), 클라이언트 `src/lib/chatbot.ts`
- 서버: Supabase Edge Function `chatbot` (게스트도 사용, JWT 검증 없음, IP당 10분 20회)
- 학습 데이터: `/chatbot-knowledge.txt` — `src/lib/chatKnowledge.ts`가 빌드 때 상품·단가표·FAQ·약관(환불)·회사 정보로 생성.
  상품·가격을 고치고 배포하면 챗봇 지식도 자동으로 바뀜(함수가 10분마다 다시 읽음).
- 상담원 연결: 답이 없거나 견적·결제·환불 처리, 사람을 원하면 `[[상담원]]` → 카카오톡 1:1 버튼.
- AI 원고: Edge Function `blog-writer` — Ollama 우선, 없으면 Claude(`ANTHROPIC_API_KEY`), 둘 다 없으면 무료 예시 원고.
  업종 루틴(음식점·카페·뷰티·병원·학원·헬스·쇼핑몰·숙박·생활서비스)은 함수의 `INDUSTRY_GUIDES`.

## 켜는 법 (Supabase → Edge Functions → Secrets)
| 이름 | 필수 | 예시 |
|---|---|---|
| `OLLAMA_BASE_URL` | 예 | `https://ollama.example.com` (외부에서 접속 가능한 주소) 또는 Ollama Cloud `https://ollama.com` |
| `OLLAMA_API_KEY` | 선택 | Ollama Cloud 키 또는 프록시 토큰 (Bearer) |
| `OLLAMA_MODEL` | 선택 | 기본 `gemma3:12b` — 한국어가 잘 되는 모델 권장 (예: `qwen3:14b`, `gemma3:27b`) |

자체 서버에서 Ollama를 돌린다면 `localhost:11434`는 Supabase에서 접근할 수 없으므로,
HTTPS 리버스 프록시(예: Cloudflare Tunnel)로 공개 주소를 만들고 토큰으로 보호한 뒤 그 주소를 넣는다.
챗봇은 지식 파일이 길어 `num_ctx: 16384`로 요청한다(모델이 지원해야 함).
