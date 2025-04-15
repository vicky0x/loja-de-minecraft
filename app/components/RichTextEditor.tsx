'use client';

import { useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Digite o conteúdo aqui...', minHeight = 200 }: RichTextEditorProps) => {
  // Estado local para acompanhar o editor quando inicializado no cliente
  const [mounted, setMounted] = useState(false);
  const [editorValue, setEditorValue] = useState(value);

  // Configuração das ferramentas do editor
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'color', 'background',
    'link',
  ];

  // Verificamos se estamos no navegador (cliente) antes de montar o editor
  useEffect(() => {
    setMounted(true);
  }, []);

  // Atualizar o estado local quando o valor prop mudar
  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  // Manipulador de mudanças no editor
  const handleChange = (content: string) => {
    // Preservar quebras de linha explicitamente convertendo-as para <br> quando necessário
    setEditorValue(content);
    onChange(content);
  };

  // Estilo personalizado para o editor
  const editorStyle = {
    minHeight: `${minHeight}px`,
    backgroundColor: '#1e1e2d',
    borderRadius: '0.375rem',
    color: 'white',
  };

  if (!mounted) {
    // Renderizar um placeholder até que o componente seja montado no cliente
    return (
      <div
        style={editorStyle}
        className="border border-dark-400 rounded-md p-3 text-gray-400"
      >
        Carregando editor...
      </div>
    );
  }

  // Usar um editor de texto simples como alternativa para React 19
  return (
    <div className="rich-text-editor text-white">
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          background-color: #171723;
          border-color: #2d2d3b !important;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        
        .ql-container.ql-snow {
          background-color: #1e1e2d;
          border-color: #2d2d3b !important;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          color: white;
          font-size: 0.875rem;
        }
        
        .ql-editor {
          min-height: ${minHeight}px;
        }
        
        .ql-editor.ql-blank::before {
          color: #6b7280;
          font-style: italic;
        }
        
        .ql-picker {
          color: #e2e8f0 !important;
        }
        
        .ql-stroke {
          stroke: #e2e8f0 !important;
        }
        
        .ql-fill {
          fill: #e2e8f0 !important;
        }
        
        .ql-picker-options {
          background-color: #171723 !important;
          border-color: #2d2d3b !important;
        }

        .ql-snow .ql-picker.ql-expanded .ql-picker-options {
          border-color: #2d2d3b !important;
        }
        
        .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {
          border-color: #2d2d3b !important;
        }
        
        .ql-snow a {
          color: #6366f1 !important;
        }
        
        .text-editor-fallback {
          min-height: ${minHeight}px;
          background-color: #1e1e2d;
          border: 1px solid #2d2d3b;
          border-radius: 0.375rem;
          color: white;
          padding: 0.75rem;
          font-size: 0.875rem;
          width: 100%;
          resize: vertical;
          transition: border-color 0.2s;
        }
        
        .text-editor-fallback:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
      `}</style>
      
      {mounted ? (
        <div className="editor-container">
          <div className="flex flex-col">
            <div className="py-2 px-3 bg-dark-300 border border-dark-400 border-b-0 rounded-t-md flex flex-wrap gap-2">
              <button 
                onClick={() => {
                  const selection = window.getSelection();
                  if (selection && selection.toString()) {
                    const selText = selection.toString();
                    const newText = editorValue.replace(
                      selText, 
                      `<strong>${selText}</strong>`
                    );
                    setEditorValue(newText);
                    onChange(newText);
                  }
                }}
                className="px-2 py-1 bg-dark-400 hover:bg-dark-500 rounded text-xs font-medium"
                type="button"
              >
                Negrito
              </button>
              <button 
                onClick={() => {
                  const selection = window.getSelection();
                  if (selection && selection.toString()) {
                    const selText = selection.toString();
                    const newText = editorValue.replace(
                      selText, 
                      `<em>${selText}</em>`
                    );
                    setEditorValue(newText);
                    onChange(newText);
                  }
                }}
                className="px-2 py-1 bg-dark-400 hover:bg-dark-500 rounded text-xs font-medium"
                type="button"
              >
                Itálico
              </button>
              <button 
                onClick={() => {
                  const selection = window.getSelection();
                  if (selection && selection.toString()) {
                    const selText = selection.toString();
                    const newText = editorValue.replace(
                      selText, 
                      `<h2>${selText}</h2>`
                    );
                    setEditorValue(newText);
                    onChange(newText);
                  }
                }}
                className="px-2 py-1 bg-dark-400 hover:bg-dark-500 rounded text-xs font-medium"
                type="button"
              >
                Título
              </button>
              <button 
                onClick={() => {
                  // Adicionar quebra de linha onde estiver o cursor
                  const textarea = document.querySelector('.text-editor-fallback') as HTMLTextAreaElement;
                  
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const newValue = editorValue.substring(0, start) + 
                                     "<br>\n" + 
                                     editorValue.substring(end);
                    
                    setEditorValue(newValue);
                    onChange(newValue);
                    
                    // Reposicionar o cursor após a quebra de linha
                    setTimeout(() => {
                      textarea.focus();
                      textarea.selectionStart = textarea.selectionEnd = start + 5;
                    }, 0);
                  }
                }}
                className="px-2 py-1 bg-dark-400 hover:bg-dark-500 rounded text-xs font-medium"
                type="button"
              >
                Quebra de Linha
              </button>
              <button 
                onClick={() => {
                  const selection = window.getSelection();
                  if (selection && selection.toString()) {
                    const selText = selection.toString();
                    const newText = editorValue.replace(
                      selText, 
                      `<a href="#" class="text-primary">${selText}</a>`
                    );
                    setEditorValue(newText);
                    onChange(newText);
                  }
                }}
                className="px-2 py-1 bg-dark-400 hover:bg-dark-500 rounded text-xs font-medium"
                type="button"
              >
                Link
              </button>
              <button 
                onClick={() => {
                  const newText = editorValue + '<ul><li>Item da lista</li></ul>';
                  setEditorValue(newText);
                  onChange(newText);
                }}
                className="px-2 py-1 bg-dark-400 hover:bg-dark-500 rounded text-xs font-medium"
                type="button"
              >
                Lista
              </button>
            </div>
            <textarea
              value={editorValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className="text-editor-fallback"
              rows={10}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            <p>Edição HTML permitida. Use as tags &lt;strong&gt;, &lt;em&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt; para formatar seu texto.</p>
          </div>
        </div>
      ) : (
        <div className="border border-dark-400 rounded-md p-3 text-gray-400 min-h-[200px]">
          Carregando editor...
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 