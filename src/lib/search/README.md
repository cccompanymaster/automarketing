# 상품 검색엔진

`search-engine.mjs`는 상품목록 검색을 위한 의존성 없는 검색 모듈입니다.

지원 범위:

- 부분 일치: `인플` → `공식 인플루언서 블로그 배포`
- 띄어쓰기·구두점 무시: `상위 노출` = `상위노출`
- 초성 검색: `ㅇㅍㄹ` → `인플루언서`
- 상품별 별칭·키워드 검색
- 기본 동의어 검색: 인플/인플루언서, 쇼핑/커머스, 후기/리뷰 등
- 짧은 오타 보정
- 제목·별칭·태그·카테고리·설명별 가중치 랭킹
- 검색어가 여러 단어일 때 부분적으로 일치하는 상품도 보조 결과로 노출

## 연결 방법

```js
import { searchProducts, suggestSearchTerms } from './search-engine.mjs';

const products = [
  {
    id: 'influencer-blog',
    title: '공식 인플루언서 블로그 배포',
    summary: '네이버 공식 인플루언서 블로그로 신뢰도 높은 배포',
    category: '블로그',
    aliases: ['인플', '인플루언서', '네이버 인플루언서', '인플 블로그'],
    keywords: ['네이버 인플루언서 배포'],
    tags: ['네이버', '블로그', '배포', '상위노출'],
  },
];

const results = searchProducts(products, searchQuery).map(({ item }) => item);
const suggestions = suggestSearchTerms(products, searchQuery);
```

기존 필터와 함께 사용할 때는 먼저 카테고리 필터를 적용한 뒤 `searchProducts`를 호출하면 됩니다.
검색어가 비어 있으면 입력 상품 순서를 그대로 반환하므로 기존 추천순 정렬도 유지됩니다.

## 상품 데이터 권장 필드

`title`과 `summary`만 있어도 검색되지만, 검색 커버리지를 높이려면 사람이 실제로 입력할 표현을 `aliases`와 `keywords`에 넣는 것이 좋습니다.

예를 들어 `공식 인플루언서 블로그 배포`는 다음 표현을 함께 등록합니다.

```js
aliases: ['인플', '인플루언서', '네이버 인플루언서', '인플 블로그'],
keywords: ['네이버 인플루언서 배포', '공식 블로그 배포'],
```

`searchProducts`의 반환값은 `{ item, score, matchedBy, index }` 형태이며, `score`가 높을수록 검색어와 직접적이고 관련성이 높은 결과입니다.

## 검증

```text
node --test outputs/search-engine/search-engine.test.mjs
```
