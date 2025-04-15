'use client';

import Script from 'next/script';

export default function ExternalScripts() {
  return (
    <>
      {/* JivoChat Widget */}
      <Script 
        id="jivochat-widget"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var widget_id = 'OnhTfOXQRg';
              var d = document;
              var w = window;

              function l() {
                var s = document.createElement('script');
                s.type = 'text/javascript';
                s.async = true;
                s.src = 'http://code.jivosite.com/script/widget/' + widget_id;
                var ss = document.getElementsByTagName('script')[0];
                ss.parentNode.insertBefore(s, ss);
              }

              if (d.readyState == 'complete') {
                l();
              } else {
                if (w.attachEvent) {
                  w.attachEvent('onload', l);
                } else {
                  w.addEventListener('load', l, false);
                }
              }
            })();
          `,
        }}
      />
    </>
  );
} 