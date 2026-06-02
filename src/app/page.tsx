import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Landing } from "@/components/Landing";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <Landing />
      <SiteFooter />
    </>
  );
}
