#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando instalação do MongoDB...${NC}"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Este script precisa ser executado como root (sudo)${NC}"
  exit 1
fi

# Importar a chave pública do MongoDB
echo -e "${YELLOW}Importando chave pública do MongoDB...${NC}"
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

# Criar o arquivo da lista para o MongoDB
echo -e "${YELLOW}Criando lista de repositório MongoDB...${NC}"
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Atualizar pacotes
echo -e "${YELLOW}Atualizando pacotes...${NC}"
apt-get update

# Instalar MongoDB
echo -e "${YELLOW}Instalando MongoDB...${NC}"
apt-get install -y mongodb-org

# Iniciar MongoDB
echo -e "${YELLOW}Iniciando serviço do MongoDB...${NC}"
systemctl start mongod

# Verificar status
echo -e "${YELLOW}Verificando status do MongoDB...${NC}"
systemctl status mongod

# Habilitar MongoDB para iniciar automaticamente
echo -e "${YELLOW}Configurando MongoDB para iniciar automaticamente...${NC}"
systemctl enable mongod

# Criar usuário admin para MongoDB (opcional)
echo -e "${YELLOW}Deseja criar um usuário admin para o MongoDB? (s/n)${NC}"
read -r create_user

if [ "$create_user" = "s" ]; then
  echo -e "${YELLOW}Digite o nome de usuário:${NC}"
  read -r username
  
  echo -e "${YELLOW}Digite a senha:${NC}"
  read -rs password
  
  # Criar usuário admin
  mongo admin --eval "db.createUser({user: '$username', pwd: '$password', roles: ['root']})"
  
  # Ativar autenticação
  echo -e "${YELLOW}Ativando autenticação no MongoDB...${NC}"
  echo "security:
  authorization: enabled" >> /etc/mongod.conf
  
  # Reiniciar MongoDB
  systemctl restart mongod
  
  # Criar banco de dados para o projeto
  mongo admin -u $username -p $password --eval "db.createDatabase('loja-minecraft')"
  
  echo -e "${GREEN}Usuário $username criado com sucesso!${NC}"
  echo -e "${YELLOW}Atualize o arquivo .env com a string de conexão:${NC}"
  echo -e "MONGODB_URI=mongodb://$username:$password@localhost:27017/loja-minecraft?authSource=admin"
else
  # Criar banco de dados para o projeto sem autenticação
  mongo --eval "use loja-minecraft"
  
  echo -e "${GREEN}MongoDB instalado sem autenticação!${NC}"
  echo -e "${YELLOW}Atualize o arquivo .env com a string de conexão:${NC}"
  echo -e "MONGODB_URI=mongodb://localhost:27017/loja-minecraft"
fi

echo -e "${GREEN}Instalação do MongoDB concluída com sucesso!${NC}" 