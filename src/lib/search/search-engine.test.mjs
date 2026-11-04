import test from 'node:test';
import assert from 'node:assert/strict';
import { searchProducts } from './search-engine.mjs';

const products = [
  {
    id: 'influencer-blog',
    title: '공식 인플루언서 블로그 배포',
    summary: '네이버 공식 인플루언서 블로그로 신뢰도 높은 배포',
    category: '블로그',
    aliases: ['인플', '인플루언서', '네이버 인플루언서', '인플 블로그'],
    tags: ['네이버', '블로그', '배포', '상위노출'],
  },
  {
    id: 'blog-distribution',
    title: '블로그 배포',
    summary: '예산과 목적에 맞는 블로그 등급을 골라 배포',
    category: '블로그',
    aliases: ['블로그 홍보'],
    tags: ['배포', '콘텐츠'],
  },
  {
    id: 'commerce-ranking',
    title: '커머스 상위노출',
    summary: '쇼핑 검색 순위 상승을 위한 실구매 리워드',
    category: '커머스 상위노출',
    aliases: ['쇼핑 상위노출', '쇼핑몰 노출'],
    tags: ['네이버 쇼핑', '상품 노출'],
  },
];

test('부분 검색어 인플은 공식 인플루언서 배포를 찾는다', () => {
  const results = searchProducts(products, '인플');

  assert.equal(results[0].item.id, 'influencer-blog');
  assert.ok(results.some((result) => result.item.id === 'influencer-blog'));
});

test('띄어쓰기와 구두점이 달라도 검색한다', () => {
  const results = searchProducts(products, '인플 루언서');

  assert.equal(results[0].item.id, 'influencer-blog');
});

test('초성 검색을 지원한다', () => {
  const results = searchProducts(products, 'ㅇㅍㄹ');

  assert.equal(results[0].item.id, 'influencer-blog');
});

test('상품에 등록한 동의어로 검색한다', () => {
  const results = searchProducts(products, '쇼핑');

  assert.equal(results[0].item.id, 'commerce-ranking');
});

test('검색어가 제목에 직접 포함된 상품을 우선한다', () => {
  const results = searchProducts(products, '블로그');

  assert.equal(results[0].item.id, 'blog-distribution');
});

test('짧은 오타는 가까운 상품을 보조 결과로 찾는다', () => {
  const results = searchProducts(products, '인플루언셔');

  assert.equal(results[0].item.id, 'influencer-blog');
  assert.ok(results[0].score < 800);
});

test('검색어가 비어 있으면 원래 상품 순서를 유지한다', () => {
  const results = searchProducts(products, '   ');

  assert.deepEqual(results.map((result) => result.item.id), products.map((item) => item.id));
});
