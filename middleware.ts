import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware vazio que permite todas as solicitações
export function middleware(request: NextRequest) {
  // Não fazer nada, apenas permitir todas as solicitações
  return NextResponse.next();
}

// Configurar um matcher vazio para que o middleware não seja executado em nenhuma rota
export const config = {
  matcher: [],
}; 