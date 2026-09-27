# 사장님 블로그 운영 (콘텐츠 파이프라인)

스킬: `.claude/skills/fire-your-seo-agency` (Phase 5). 요약 절차:

1. **질문 고르기** — `content/backlog.md`에서 우선순위 높은 질문 (서치콘솔·서치어드바이저 검색어가 1순위)
2. **브리프 5줄** — 질문 / 직답(80자 이내, 수치 포함) / 근거 표 + 기준일 + 출처 / FAQ 3개 / 내부 링크(허브 1 + 관련 2)
3. **글 작성** — `content/blog/<slug>.md` (slug: 영문 소문자-하이픈, 날짜 없이). frontmatter 예시는 기존 글 참고
   - 첫 줄 직답은 `answer`에 쓰면 화면 맨 위에 자동으로 나감. 본문은 `##` 하위 질문부터 (`#` 금지)
   - 숫자 셋 이상이면 표, 수치 옆에 기준일(data_asof) 표기
   - `reviewedBy`: 수치를 원출처와 대조한 사람 (AI 초안이면 필수). 대량 자동 발행 금지
4. **발행 게이트** — `npm test` (`src/lib/__tests__/blog-gate.test.ts`): 필수 항목·길이·기준일·출처·FAQ·내부 링크(끊긴 링크 0) 검사.
   배포 워크플로가 빌드 전에 실행하므로 실패하면 배포되지 않음
5. **자동으로 되는 것** — 글 페이지·목록·RSS(`/feed.xml`)·사이트맵(lastmod=dateModified)·llms.txt·JSON-LD(BlogPosting+FAQPage+Breadcrumb)·
   IndexNow 핑(배포 후, 최근 3일 내 변경분)
6. **발행 후** — 네이버 서치어드바이저 수집 요청(수동) → `content/inventory.md`에 기준선·14일 뒤 재측정일 기록

갱신: 내용이 실제로 바뀔 때만 `dateModified`를 올리고 `changelog`에 한 줄 추가. 같은 질문 중복은 301 병합, 삭제는 최후 수단.
