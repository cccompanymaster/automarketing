import { CalcShell, calcMetadata, type FaqItem } from "@/components/calc/CalcShell";
import { LaborContractBuilder } from "@/components/calc/tools/LaborContractBuilder";

export const metadata = calcMetadata("labor-contract");

const FAQ: FaqItem[] = [
  {
    q: "아르바이트도 근로계약서를 써야 하나요?",
    a: "네. 하루만 일하는 단기 아르바이트라도 임금, 근로시간, 휴일, 연차휴가, 근무 장소와 업무를 적은 계약서를 쓰고 근로자에게 한 부를 줘야 해요. 쓰지 않거나 주지 않으면 벌금이나 과태료 대상이 될 수 있어요.",
  },
  {
    q: "휴게시간은 얼마나 줘야 하나요?",
    a: "하루 근로시간이 4시간이면 30분 이상, 8시간이면 1시간 이상을 근무 도중에 줘야 해요. 출근 전이나 퇴근 직전에 몰아서 주는 방식은 휴게로 인정받기 어려워요. 이 도구는 요일마다 휴게가 부족하면 바로 표시해요.",
  },
  {
    q: "월급제인데 최저임금은 어떻게 확인하나요?",
    a: "월급을 한 달 소정근로시간(주휴 포함)으로 나눠 시간당 금액을 구한 뒤 최저임금과 비교해요. 주 40시간이면 월 209시간이 기준이고, 단시간 근로자는 (주 소정근로시간 + 주휴시간) × 약 4.345주로 계산해요.",
  },
  {
    q: "만 18세 미만 청소년을 고용할 때 주의할 점은?",
    a: "친권자(후견인) 동의서와 가족관계증명서를 사업장에 갖춰야 하고, 근로시간은 하루 7시간·주 35시간을 넘길 수 없어요. 밤 10시부터 오전 6시 사이와 휴일에는 본인 동의와 노동부 인가 없이 일을 시킬 수 없고, 만 15세 미만은 취직인허증이 필요해요.",
  },
  {
    q: "작성한 계약서 내용이 서버에 남나요?",
    a: "아니요. 사업주·근로자 정보와 계약 내용은 이 브라우저 안에서만 쓰이고 서버로 전송되지 않아요. 공유 링크도 만들지 않으니 인쇄하거나 PDF로 저장해 보관하세요.",
  },
];

export default function Page() {
  return (
    <CalcShell slug="labor-contract" faq={FAQ} wide>
      <LaborContractBuilder />
    </CalcShell>
  );
}
