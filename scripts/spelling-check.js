#!/usr/bin/env node

/**
 * Script para verificação ortográfica dos textos em português
 * Utiliza o dicionário brasileiro e verifica textos em arquivos JSX/TSX
 * 
 * Para executar:
 * node scripts/spelling-check.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const chalk = require('chalk');

// Palavras comuns que são técnicas ou específicas
const whitelist = [
  'minecraft', 'login', 'logout', 'dashboard', 'admin', 'sidebar',
  'premium', 'checkout', 'api', 'online', 'offline', 'email', 'app',
  'frontend', 'backend', 'minecraftloja', 'cart', 'token', 'download',
  'skin', 'account', 'username', 'password', 'storage', 'google', 'browser'
];

// Correções comuns de ortografia em português
const corrections = {
  'nao': 'não',
  'esta': 'está',
  'voce': 'você',
  'tambem': 'também',
  'disponivel': 'disponível',
  'historico': 'histórico',
  'possivel': 'possível',
  'facil': 'fácil',
  'pagina': 'página',
  'codigo': 'código',
  'metodo': 'método',
  'credito': 'crédito',
  'cartao': 'cartão',
  'rapido': 'rápido',
  'numero': 'número',
  'ultima': 'última',
  'multiplas': 'múltiplas',
  'multiplos': 'múltiplos',
  'obrigatorio': 'obrigatório',
  'endereco': 'endereço',
  'opcoes': 'opções',
  'transacao': 'transação',
  'seguranca': 'segurança',
  'necessario': 'necessário',
  'facam': 'façam',
  'atencao': 'atenção',
  'referencia': 'referência',
  'informatica': 'informática',
  'tecnico': 'técnico',
  'anuncio': 'anúncio',
  'pratico': 'prático',
  'maximo': 'máximo',
  'minimo': 'mínimo',
  'duvida': 'dúvida',
  'invalido': 'inválido',
  'valido': 'válido',
  'aplicacao': 'aplicação',
  'promocao': 'promoção',
  'espaco': 'espaço',
  'memoria': 'memória',
  'automatica': 'automática',
  'automatico': 'automático',
  'economico': 'econômico',
  'agencia': 'agência',
  'conteudo': 'conteúdo',
  'nivel': 'nível',
  'basico': 'básico',
  'intermediario': 'intermediário',
  'avancado': 'avançado',
  'serie': 'série',
  'multiplo': 'múltiplo',
  'exclusao': 'exclusão',
  'publico': 'público',
  'estatisticas': 'estatísticas',
  'icone': 'ícone'
};

// Diretórios para verificação
const directories = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../pages'),
  path.join(__dirname, '../components')
];

// Extensões de arquivos a verificar
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Expressão regular para extrair textos em português
const textRegex = /(['"])([^'"]*[áàâãéèêíïóôõúüçÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ][^'"]*)\1/g;

// Expressão regular para identificar palavras
const wordRegex = /[a-zA-ZáàâãéèêíïóôõúüçÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ]+/g;

// Função principal
async function main() {
  console.log(chalk.blue('🔎 Iniciando verificação ortográfica...'));
  let filesChecked = 0;
  let issuesFound = 0;

  for (const dir of directories) {
    try {
      await checkDirectory(dir);
    } catch (err) {
      console.error(chalk.red(`Erro ao verificar diretório ${dir}:`), err);
    }
  }

  console.log(chalk.green(`✅ Verificação concluída! ${filesChecked} arquivos verificados.`));
  if (issuesFound > 0) {
    console.log(chalk.yellow(`⚠️ ${issuesFound} possíveis problemas encontrados.`));
  } else {
    console.log(chalk.green('👍 Nenhum problema encontrado!'));
  }

  // Função para verificar um diretório recursivamente
  async function checkDirectory(directory) {
    const items = await readdir(directory, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      
      if (item.isDirectory()) {
        // Ignorar node_modules
        if (item.name === 'node_modules') continue;
        await checkDirectory(fullPath);
      } else if (item.isFile() && extensions.includes(path.extname(item.name))) {
        await checkFile(fullPath);
        filesChecked++;
      }
    }
  }

  // Função para verificar um arquivo
  async function checkFile(filePath) {
    try {
      const content = await readFile(filePath, 'utf8');
      const relPath = path.relative(process.cwd(), filePath);
      
      // Encontrar todos os textos em português
      const matches = [...content.matchAll(textRegex)];
      
      for (const match of matches) {
        const text = match[2];
        if (text.length < 3) continue; // Ignorar textos muito curtos
        
        // Verificar cada palavra no texto
        const words = text.match(wordRegex) || [];
        for (const word of words) {
          // Ignorar palavras curtas ou na whitelist
          if (word.length < 3 || whitelist.includes(word.toLowerCase())) {
            continue;
          }
          
          // Verificar se é uma palavra sem acentuação que deveria ter
          const lowerWord = word.toLowerCase();
          if (corrections[lowerWord]) {
            console.log(chalk.yellow(`Possível erro ortográfico em ${chalk.cyan(relPath)}:`));
            console.log(`  "${word}" - Sugestão: "${corrections[lowerWord]}"`);
            console.log(`  Contexto: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
            console.log();
            issuesFound++;
          }
        }
      }
    } catch (err) {
      console.error(chalk.red(`Erro ao verificar arquivo ${filePath}:`), err);
    }
  }
}

main().catch(err => {
  console.error(chalk.red('Erro ao executar verificação ortográfica:'), err);
  process.exit(1);
}); 