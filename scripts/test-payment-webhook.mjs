// Test the deployed handler with fake provider/storage boundaries. No network.
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync(new URL("../supabase/functions/payment-webhook/index.ts",import.meta.url),"utf8").replace(/^import [^\n]+\n/gm,"");
const js = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(status="PAID", sig=true, error=null) {
  let handler; const calls=[];
  const detail={id:"test-payment",status,currency:"KRW",customData:'{"userId":"fixture"}',paidAt:"2026-11-07T00:00:00Z",amount:{total:11000,cancelled:status==="CANCELLED"?11000:5500}};
  vm.runInNewContext(js,{Deno:{env:{get:()=>"fixture"},serve:fn=>{handler=fn;}},Response,
    Webhook:{verify:async()=>{if(!sig)throw Error();return {data:{paymentId:detail.id}};}},
    Payment:{isUnrecognizedPayment:()=>false},PaymentClient:()=>({getPayment:async()=>detail}),
    createClient:()=>({from:()=>({insert:async row=>{calls.push(["review",row]);return {error}}}),rpc:async(name,args)=>{calls.push([name,args]);return {error}}})});
  return {calls,detail,run:()=>handler(new Request("https://test.invalid",{method:"POST",body:"{}"}))};
}
test("invalid webhook signature cannot touch the ledger or the review queue",async()=>{const f=fixture("PAID",false);assert.equal((await f.run()).status,401);assert.equal(f.calls.length,0);});
test("paid event credits KRW once through the existing idempotent RPC",async()=>{const f=fixture();assert.equal((await f.run()).status,200);assert.equal(f.calls[0][0],"credit_payment");assert.equal(f.calls[0][1].p_amount,10000);});
test("partial and full cancellations never debit or credit a customer",async()=>{for(const s of ["CANCELLED","PARTIAL_CANCELLED"]){const f=fixture(s);assert.equal((await f.run()).status,200);assert.deepEqual(f.calls.map(c=>c[0]),["review"]);}});
test("duplicate is acknowledged, storage failure retried, excessive cancellation refused",async()=>{assert.equal((await fixture("CANCELLED",true,{code:"23505"}).run()).status,200);assert.equal((await fixture("CANCELLED",true,{code:"42501"}).run()).status,503);const f=fixture("CANCELLED");f.detail.amount.cancelled=12000;assert.equal((await f.run()).status,502);assert.equal(f.calls.length,0);});
