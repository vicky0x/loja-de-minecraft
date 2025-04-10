#!/bin/bash

# Script de configuração inicial da VPS para hospedar Loja de Minecraft
# Rode como sudo: sudo bash initial-setup.sh

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Este script precisa ser executado como root (sudo)${NC}"
  exit 1
fi

echo -e "${YELLOW}Iniciando configuração da VPS para Loja de Minecraft...${NC}"

# Atualizar sistema
echo -e "${YELLOW}Atualizando sistema...${NC}"
apt update && apt upgrade -y

# Instalar dependências básicas
echo -e "${YELLOW}Instalando dependências básicas...${NC}"
apt install -y curl wget git build-essential nginx ufw fail2ban htop

# Configurar Firewall
echo -e "${YELLOW}Configurando firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Instalar Node.js
echo -e "${YELLOW}Instalando Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar versões
echo -e "${YELLOW}Versões instaladas:${NC}"
node -v
npm -v

# Instalar PM2 globalmente
echo -e "${YELLOW}Instalando PM2...${NC}"
npm install -g pm2

# Perguntar se deseja instalar MongoDB
echo -e "${YELLOW}Deseja instalar o MongoDB localmente? (s/n)${NC}"
read -r install_mongodb

if [ "$install_mongodb" = "s" ]; then
  # Instalação do MongoDB
  echo -e "${YELLOW}Importando chave pública do MongoDB...${NC}"
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

  # Criar lista de repositório para Ubuntu
  echo -e "${YELLOW}Criando lista de repositório MongoDB...${NC}"
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

  # Atualizar pacotes e instalar MongoDB
  apt update
  apt install -y mongodb-org

  # Iniciar MongoDB e configurar para iniciar na inicialização
  systemctl start mongod
  systemctl enable mongod

  echo -e "${GREEN}MongoDB instalado e configurado!${NC}"
else
  echo -e "${YELLOW}Pulando instalação do MongoDB. Você precisará usar um serviço externo.${NC}"
fi

# Criar diretório do projeto
PROJECT_DIR="/home/$SUDO_USER/loja-minecraft"
echo -e "${YELLOW}Criando diretório do projeto em: $PROJECT_DIR${NC}"
mkdir -p "$PROJECT_DIR"
chown -R "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR"

# Configurar Nginx
echo -e "${YELLOW}Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/loja-minecraft << EOF
server {
    listen 80;
    # server_name seudominio.com www.seudominio.com;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /_next/static/ {
        proxy_pass http://localhost:3000/_next/static/;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    location /static/ {
        proxy_pass http://localhost:3000/static/;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

# Ativar configuração do Nginx
ln -sf /etc/nginx/sites-available/loja-minecraft /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Configurar fail2ban para proteção adicional
echo -e "${YELLOW}Configurando fail2ban para proteção...${NC}"
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl restart fail2ban

# Perguntar se quer clonar o repositório agora
echo -e "${YELLOW}Deseja clonar o repositório agora? (s/n)${NC}"
read -r clone_repo

if [ "$clone_repo" = "s" ]; then
  echo -e "${YELLOW}Digite a URL do repositório:${NC}"
  read -r repo_url
  
  # Clonar repositório
  su - "$SUDO_USER" -c "git clone $repo_url $PROJECT_DIR"
  
  # Instalar dependências e configurar
  cd "$PROJECT_DIR" || exit
  su - "$SUDO_USER" -c "cd $PROJECT_DIR && npm install"
  
  # Criar arquivo .env.production vazio para editar depois
  touch "$PROJECT_DIR/.env.production"
  chown "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR/.env.production"
  
  echo -e "${GREEN}Repositório clonado com sucesso!${NC}"
  echo -e "${YELLOW}IMPORTANTE: Edite o arquivo .env.production com suas variáveis de ambiente!${NC}"
else
  echo -e "${YELLOW}Você poderá clonar o repositório depois manualmente.${NC}"
fi

# Informações finais
IP_ADDRESS=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}Configuração inicial concluída com sucesso!${NC}"
echo -e "${YELLOW}Para completar a configuração:${NC}"
echo -e "1. Edite o arquivo .env.production com suas variáveis (especialmente JWT_SECRET)"
echo -e "2. Faça build do projeto: cd $PROJECT_DIR && npm run build"
echo -e "3. Inicie com PM2: cd $PROJECT_DIR && pm2 start ecosystem.config.js"
echo -e "4. Acesse seu site em: http://$IP_ADDRESS"

# Informar status dos serviços
echo -e "\n${YELLOW}Status dos serviços:${NC}"
systemctl status nginx --no-pager | head -n 5
if [ "$install_mongodb" = "s" ]; then
  systemctl status mongod --no-pager | head -n 5
fi 