import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head />
      <body>
        <Main />
        <NextScript />
        <script
          type="text/javascript"
          charSet="utf-8"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', () => { 
                const widgetElement = document.createElement('charla-widget'); 
                widgetElement.setAttribute("p", "fa696af4-1622-4275-8c59-6fa5175705cd"); 
                document.body.appendChild(widgetElement); 
                const widgetCode = document.createElement('script'); 
                widgetCode.src = 'https://app.getcharla.com/widget/widget.js'; 
                document.body.appendChild(widgetCode); 
              })
            `
          }}
        />
      </body>
    </Html>
  )
} 