'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          className: 'fantasy-toast',
          style: {
            background: 'rgba(24, 24, 29, 0.8)',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            fontSize: '15px',
            maxWidth: '360px',
            fontWeight: 500,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            transform: 'translateY(-24px)',
            margin: '0 auto 24px auto',
          },
          success: {
            icon: '✓',
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff'
            },
            style: {
              background: 'rgba(24, 24, 29, 0.8)',
              borderBottom: '3px solid #10b981',
            },
          },
          error: {
            icon: '×',
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff'
            },
            style: {
              background: 'rgba(24, 24, 29, 0.8)',
              borderBottom: '3px solid #ef4444',
            },
          },
          loading: {
            style: {
              background: 'rgba(24, 24, 29, 0.8)',
              borderBottom: '3px solid #6366f1',
            },
          },
        }}
      />
      <style jsx global>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes toastOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(24px);
          }
        }
        
        .fantasy-toast {
          animation: toastIn 0.3s ease forwards;
        }
        
        .fantasy-toast[data-state="leaving"] {
          animation: toastOut 0.3s ease forwards;
        }
        
        .fantasy-toast[data-state="removed"] {
          display: none;
        }
        
        /* Ajuste para garantir que os toasts não conflitem com o botão de chat */
        @media (max-width: 768px) {
          .fantasy-toast {
            margin-bottom: 80px !important;
          }
        }
      `}</style>
      {children}
    </>
  );
} 