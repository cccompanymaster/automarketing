// Visitor tags: GA4 (gtag.js, loaded directly), the GTM container (Meta Pixel
// and anything else added later), and — once their ids are set — Microsoft
// Clarity and 네이버 애널리틱스. Ids come from lib/trackingIds; every tag
// renders nothing outside production builds or without an id.

import Script from "next/script";
import { CLARITY_ID, GA4_ID, GTM_ID, NAVER_ANALYTICS_ID } from "@/lib/trackingIds";

export function GtmScript() {
  return (
    <>
      {GA4_ID && (
        <>
          <Script
            id="ga4-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_ID}');`}
          </Script>
        </>
      )}
      {GTM_ID && <GtmContainer />}
      {CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
      {NAVER_ANALYTICS_ID && (
        <>
          <Script id="naver-wcs-src" src="https://wcs.naver.net/wcslog.js" strategy="afterInteractive" />
          <Script id="naver-wcs-init" strategy="afterInteractive">
            {`window.wcs_add = window.wcs_add || {}; wcs_add["wa"] = "${NAVER_ANALYTICS_ID}";
(function run(n){ if (window.wcs) { window.wcs_do(); } else if (n < 40) { setTimeout(function(){ run(n + 1); }, 250); } })(0);`}
          </Script>
        </>
      )}
    </>
  );
}

function GtmContainer() {
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

export function GtmNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="gtm"
      />
    </noscript>
  );
}
