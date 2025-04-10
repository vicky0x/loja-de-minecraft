#!/bin/bash

# Script de deploy para Loja de Minecraft
# Execute com: bash deploy.sh

# Definir diretório do projeto
APP_DIR="$HOME/loja-de-minecraft"
BACKUP_DIR="$HOME/backups/loja-minecraft"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Criar pasta de backup se não existir
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Iniciando deploy da Loja de Minecraft...${NC}"

# Verificar se o diretório do projeto existe
if [ ! -d "$APP_DIR" ]; then
  echo -e "${YELLOW}Diretório do projeto não encontrado. Clonando repositório...${NC}"
  git clone https://github.com/vicky0x/loja-de-minecraft.git $APP_DIR
  cd $APP_DIR
else
  cd $APP_DIR
  
  # Fazer backup do .env antes de atualizar
  if [ -f ".env" ]; then
    echo -e "${YELLOW}Fazendo backup do arquivo .env...${NC}"
    cp .env $BACKUP_DIR/.env.backup_$(date +%Y%m%d_%H%M%S)
  fi
  
  # Fazer backup do banco de dados se o MongoDB estiver instalado localmente
  if command -v mongodump &> /dev/null && [ -d "/var/lib/mongodb" ]; then
    echo -e "${YELLOW}Fazendo backup do banco de dados...${NC}"
    BACKUP_FILE=$BACKUP_DIR/mongodb_backup_$(date +%Y%m%d_%H%M%S).gz
    mongodump --archive=$BACKUP_FILE --gzip --db=loja-minecraft
  fi
  
  echo -e "${YELLOW}Atualizando o código-fonte...${NC}"
  git pull
fi

# Verificar se existe .env, se não, copiar de .env.production
if [ ! -f ".env" ] && [ -f ".env.production" ]; then
  echo -e "${YELLOW}Arquivo .env não encontrado. Copiando de .env.production...${NC}"
  cp .env.production .env
  echo -e "${RED}IMPORTANTE: Edite o arquivo .env e configure suas variáveis de ambiente!${NC}"
fi

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
npm install

# Build do projeto
echo -e "${YELLOW}Buildando o projeto...${NC}"
npm run build

# Reiniciar a aplicação com PM2
if command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}Reiniciando a aplicação com PM2...${NC}"
  
  # Verificar se a aplicação já está registrada no PM2
  if pm2 list | grep -q "loja-minecraft"; then
    pm2 reload loja-minecraft
  else
    pm2 start ecosystem.config.js
  fi
  
  # Salvar configuração do PM2
  pm2 save
else
  echo -e "${RED}PM2 não está instalado. Instale com: npm install -g pm2${NC}"
  exit 1
fi

echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
echo -e "${YELLOW}Acesse sua aplicação em: http://localhost:3000 ou pelo IP do servidor${NC}" 