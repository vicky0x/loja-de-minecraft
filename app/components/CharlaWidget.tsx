'use client';

import { useEffect } from 'react';

export default function CharlaWidget() {
  useEffect(() => {
    const widgetElement = document.createElement('charla-widget');
    widgetElement.setAttribute("p", "fa696af4-1622-4275-8c59-6fa5175705cd");
    document.body.appendChild(widgetElement);
    
    const widgetCode = document.createElement('script');
    widgetCode.src = 'https://app.getcharla.com/widget/widget.js';
    document.body.appendChild(widgetCode);
    
    return () => {
      const existingWidget = document.querySelector('charla-widget');
      const existingScript = document.querySelector('script[src="https://app.getcharla.com/widget/widget.js"]');
      
      if (existingWidget) {
        existingWidget.remove();
      }
      
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
} 