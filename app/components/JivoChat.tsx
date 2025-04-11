'use client';

import { useEffect } from 'react';

export default function JivoChat() {
  useEffect(() => {
    try {
      // Abordagem 1: Script direto com protocolo explícito
      const script = document.createElement('script');
      script.src = 'http://code.jivosite.com/widget/OnhTfOXQRg';
      script.async = true;
      document.body.appendChild(script);
      
      // Abordagem 2: Injetar o código de inicialização do Jivo diretamente
      // Essa abordagem pode contornar algumas restrições de CSP
      const inlineScript = document.createElement('script');
      inlineScript.type = 'text/javascript';
      inlineScript.innerHTML = `
        window.jivo_onLoadCallback = function() {
          console.log('JivoChat carregado com sucesso!');
        };
        
        (function() {
          var widget_id = 'OnhTfOXQRg';
          var s = document.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = 'http://code.jivosite.com/script/widget/' + widget_id;
          var ss = document.getElementsByTagName('script')[0];
          ss.parentNode.insertBefore(s, ss);
        })();
      `;
      document.body.appendChild(inlineScript);
    } catch (error) {
      console.error('Erro ao carregar JivoChat:', error);
    }

    return () => {
      // Cleanup function
      const scripts = document.querySelectorAll('script');
      scripts.forEach(s => {
        if (s.src.includes('code.jivosite.com') || s.innerHTML.includes('jivo')) {
          s.remove();
        }
      });
      
      // Remover também quaisquer elementos que o JivoChat tenha adicionado
      const jivoElements = document.querySelectorAll('[id^="jivo"]');
      jivoElements.forEach(el => el.remove());
    };
  }, []);

  return null;
} 