'use client';

import { useEffect } from 'react';

export default function CharlaWidget() {
  useEffect(() => {
    // Adicionar o script exatamente como solicitado pelo usuário
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.innerHTML = `
      window.addEventListener('load', () => { 
        const widgetElement = document.createElement('charla-widget'); 
        widgetElement.setAttribute("p", "fa696af4-1622-4275-8c59-6fa5175705cd"); 
        document.body.appendChild(widgetElement);
        const widgetCode = document.createElement('script'); 
        widgetCode.src = 'https://app.getcharla.com/widget/widget.js'; 
        document.body.appendChild(widgetCode); 
      })
    `;
    document.body.appendChild(script);

    return () => {
      // Cleanup function
      const scripts = document.querySelectorAll('script');
      scripts.forEach(s => {
        if (s.innerHTML.includes('charla-widget')) {
          s.remove();
        }
      });
    };
  }, []);

  return null;
} 