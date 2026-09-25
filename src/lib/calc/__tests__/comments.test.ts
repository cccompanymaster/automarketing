import { describe, expect, it } from "vitest";
import { buildThreads, validateComment, type CommentRow } from "../comments";

const draft = { nickname: "사장님", password: "1234", body: "도움이 됐어요" };

describe("validateComment", () => {
  it("accepts a normal comment", () => expect(validateComment(draft)).toBeNull());
  it("rejects empty / long nickname and html brackets", () => {
    expect(validateComment({ ...draft, nickname: " " })).toContain("닉네임");
    expect(validateComment({ ...draft, nickname: "가".repeat(21) })).toContain("닉네임");
    expect(validateComment({ ...draft, nickname: "<b>x</b>" })).toContain("기호");
  });
  it("password length bounds", () => {
    expect(validateComment({ ...draft, password: "123" })).toContain("비밀번호");
    expect(validateComment({ ...draft, password: "1".repeat(31) })).toContain("비밀번호");
    expect(validateComment({ ...draft, password: "1234" })).toBeNull();
  });
  it("body bounds and link spam", () => {
    expect(validateComment({ ...draft, body: "a" })).toContain("2자");
    expect(validateComment({ ...draft, body: "a".repeat(1001) })).toContain("1,000");
    expect(validateComment({ ...draft, body: "http://a http://b http://c" })).toContain("링크");
  });
});

describe("buildThreads", () => {
  const row = (id: string, parentId: string | null, deleted = false): CommentRow => ({
    id,
    parentId,
    nickname: "n",
    body: "b",
    createdAt: "2026-09-25T00:00:00Z",
    deleted,
  });
  it("nests replies under parents", () => {
    const t = buildThreads([row("a", null), row("b", "a"), row("c", null)]);
    expect(t.map((x) => x.id)).toEqual(["a", "c"]);
    expect(t[0].replies.map((r) => r.id)).toEqual(["b"]);
  });
  it("keeps a deleted parent only while it has live replies", () => {
    expect(buildThreads([row("a", null, true), row("b", "a")])).toHaveLength(1);
    expect(buildThreads([row("a", null, true), row("b", "a", true)])).toHaveLength(0);
    expect(buildThreads([row("a", null, true)])).toHaveLength(0);
  });
});
