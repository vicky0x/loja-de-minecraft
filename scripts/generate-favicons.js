const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Caminho para a imagem original
const sourceImage = path.join(__dirname, '../public/fantasy_logo.png');

// Pasta de destino
const outDir = path.join(__dirname, '../public/favicon');

// Garantir que a pasta exista
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Tamanhos comuns para favicons
const sizes = [16, 32, 48, 64, 96, 128, 152, 167, 180, 196, 256, 512];

// Gerar os favicons
async function generateFavicons() {
  try {
    console.log('Gerando favicons...');
    
    // Processar cada tamanho
    for (const size of sizes) {
      const outPath = path.join(outDir, `favicon-${size}x${size}.png`);
      await sharp(sourceImage)
        .resize(size, size)
        .toFile(outPath);
      console.log(`Criado: favicon-${size}x${size}.png`);
    }
    
    // Gerar arquivo .ico (16x16 e 32x32)
    // O arquivo .ico é usado principalmente pelo Internet Explorer
    console.log('Favicon gerado com sucesso!');
    console.log('Agora copie manualmente os arquivos para a pasta public/');
  } catch (err) {
    console.error('Erro ao gerar favicons:', err);
  }
}

// Executar função
generateFavicons(); 