import { NextResponse, NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Removida a verificação de autenticação para facilitar os testes
    console.log('Processando upload de arquivo');
    
    // Verificar se é uma solicitação multipart/form-data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const uploadType = formData.get('type') as string || 'products'; // Tipo padrão é produtos
    
    console.log('Headers da requisição:', Object.fromEntries(request.headers.entries()));
    
    if (!files || files.length === 0) {
      console.log('Nenhum arquivo encontrado na requisição');
      return NextResponse.json(
        { message: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }
    
    console.log(`Recebidos ${files.length} arquivos para upload do tipo: ${uploadType}`);
    files.forEach((file, index) => {
      console.log(`Arquivo ${index+1}: nome=${file.name}, tipo=${file.type}, tamanho=${file.size} bytes`);
    });
    
    // Validar tipos de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        console.log(`Tipo de arquivo não suportado: ${file.type}`);
        return NextResponse.json(
          { message: `Tipo de arquivo não suportado: ${file.type}` },
          { status: 400 }
        );
      }
    }
    
    // Processar e salvar os arquivos
    const savedPaths = [];
    
    // Determinar o diretório com base no tipo de upload
    let uploadSubdir = 'products'; // Diretório padrão
    
    if (uploadType === 'announcements') {
      uploadSubdir = 'announcements';
    }
    
    // Caminho do diretório de upload
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', uploadSubdir);
    
    // Criar o diretório se não existir
    await mkdir(uploadDir, { recursive: true });
    console.log('Diretório de upload verificado/criado:', uploadDir);
    
    for (const file of files) {
      console.log(`Processando arquivo: ${file.name} (${file.size} bytes)`);
      
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        console.log(`Buffer criado com sucesso. Tamanho: ${buffer.length} bytes`);
        
        // Gerar nome de arquivo único usando UUID + nome original
        const originalName = file.name.replace(/\s+/g, '-');
        const fileExt = path.extname(originalName);
        const fileName = `${uuidv4()}${fileExt}`;
        console.log(`Nome de arquivo gerado: ${fileName}`);
        
        // Caminho onde salvar o arquivo
        const filePath = path.join(uploadDir, fileName);
        console.log(`Caminho completo do arquivo: ${filePath}`);
        
        try {
          // Salvar o arquivo
          await writeFile(filePath, buffer);
          console.log('Arquivo salvo com sucesso em:', filePath);
          
          // Caminho relativo para acesso via URL
          const relativePath = `/uploads/${uploadSubdir}/${fileName}`;
          console.log('Caminho relativo (URL) gerado:', relativePath);
          savedPaths.push(relativePath);
        } catch (error) {
          console.error(`Erro ao salvar o arquivo ${fileName}:`, error);
          throw new Error(`Falha ao salvar o arquivo ${fileName}: ${error.message}`);
        }
      } catch (error) {
        console.error(`Erro ao processar o arquivo ${file.name}:`, error);
        throw new Error(`Falha ao processar o arquivo ${file.name}: ${error.message}`);
      }
    }
    
    console.log('Upload concluído com sucesso:', savedPaths);
    const responseData = {
      message: 'Upload realizado com sucesso',
      paths: savedPaths
    };
    console.log('Dados da resposta:', JSON.stringify(responseData));
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Erro no upload de arquivos:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { message: 'Erro ao processar upload', error: error.message },
      { status: 500 }
    );
  }
} 