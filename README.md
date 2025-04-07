# Fantasy Store

Fantasy Store é uma loja online moderna para venda de cheats para jogos, desenvolvida com tecnologias modernas e uma arquitetura robusta.

## Tecnologias Utilizadas

- **Frontend**: React.js + Next.js
- **Backend**: Node.js com Express
- **Banco de Dados**: MongoDB com Mongoose
- **Autenticação**: Cookies ao invés de JWT
- **UI Framework**: TailwindCSS
- **Gerenciamento de Estado**: React Context API

## Estrutura do Projeto

```
fantasystore/
├── app/                    # Diretório principal do Next.js
│   ├── (site)/             # Rotas públicas do site
│   ├── admin/              # Dashboard administrativo
│   ├── api/                # API routes do Next.js
│   ├── auth/               # Páginas de autenticação
│   ├── components/         # Componentes compartilhados
│   ├── lib/                # Bibliotecas e utilitários
│   │   ├── auth/           # Funções de autenticação
│   │   ├── db/             # Conexão com banco de dados
│   │   └── models/         # Modelos do Mongoose
│   ├── products/           # Páginas de produtos
│   └── user/               # Painel do usuário
├── public/                 # Arquivos públicos
└── middleware.ts           # Middleware para proteção de rotas
```

## Funcionalidades Principais

- **Site Principal**: Página inicial, catálogo de produtos, FAQ
- **Sistema de Autenticação**: Registro, login, recuperação de senha
- **Catálogo de Produtos**: Listagem, categorias, detalhes
- **Sistema de Pagamento**: PIX, cartão de crédito (Mercado Pago)
- **Painel do Cliente**: Visualização dos produtos adquiridos, histórico
- **Painel Administrativo**: Dashboard com estatísticas, gestão de produtos, usuários, pedidos, cupons e categorias

## Sistema de Recuperação de Senha

O projeto inclui um sistema completo de recuperação de senha:

1. **Solicitação de Redefinição**: Usuários podem solicitar a redefinição através da página `/auth/forgot-password`
2. **Email de Recuperação**: Um email contendo um link seguro com token é enviado ao usuário
3. **Verificação de Token**: O token é validado antes de permitir a redefinição da senha
4. **Página de Redefinição**: Interface intuitiva para criar uma nova senha
5. **Segurança**: Tokens expiram após 1 hora e são utilizados apenas uma vez

Para configurar o envio de emails, preencha as variáveis de ambiente `SMTP_*` no arquivo `.env`.

## Como Executar

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Crie um arquivo `.env` baseado no `.env.example`
4. Execute o servidor de desenvolvimento:
   ```
   npm run dev
   ```
5. Acesse `http://localhost:3000`

## Desenvolvimento

Este projeto foi desenvolvido com uma arquitetura modular e sustentável, visando facilitar a manutenção e escalabilidade. Cada componente e módulo foi cuidadosamente pensado para funcionar de forma independente, seguindo os princípios SOLID e boas práticas de desenvolvimento web.

## Contribuição

Contribuições são bem-vindas! Para contribuir, siga estes passos:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nome-da-feature`)
5. Abra um Pull Request

# Fantasy Minecraft Store

Loja online para produtos de Minecraft e outros produtos digitais.

## Instruções para Deploy em Produção

Este guia detalha o processo para colocar a aplicação em produção de forma segura e otimizada.

### Pré-requisitos

- Node.js 18+ (recomendado 18.x LTS)
- MongoDB
- Nginx (para proxy reverso)
- PM2 (opcional, para gerenciamento de processos)
- Certificado SSL

### 1. Preparação do Ambiente

#### 1.1 Clone o repositório:

```bash
git clone https://github.com/seu-usuario/loja-de-minecraft.git
cd loja-de-minecraft
```

#### 1.2 Configure as variáveis de ambiente:

Copie o arquivo `.env.example` para `.env.production` e configure as variáveis:

```bash
cp .env.example .env.production
nano .env.production
```

**Importante**: Gere valores fortes e únicos para:
- `NEXTAUTH_SECRET` e `JWT_SECRET`
- Configure corretamente a URI do MongoDB com credenciais de produção
- Configure o token do Mercado Pago para produção
- Defina o URL correto em `NEXT_PUBLIC_API_URL`

### 2. Construção e Inicialização

#### 2.1 Instalação de dependências:

```bash
npm install
```

#### 2.2 Build para produção:

```bash
npm run build:prod
```

#### 2.3 Iniciando o servidor:

Via Next.js diretamente:
```bash
npm run start:prod
```

Via PM2 (recomendado para produção):
```bash
npm install -g pm2
npm run pm2:start
```

### 3. Configuração do Nginx

#### 3.1 Instale o Nginx:

```bash
sudo apt update
sudo apt install nginx
```

#### 3.2 Configure o Nginx:

Copie o arquivo `nginx.conf` para o diretório de configuração:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/fantasystore
sudo ln -s /etc/nginx/sites-available/fantasystore /etc/nginx/sites-enabled/
```

#### 3.3 Configure SSL:

Obtenha um certificado SSL (Certbot/Let's Encrypt é uma opção gratuita):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d fantasystore.com.br -d www.fantasystore.com.br
```

#### 3.4 Teste e reinicie o Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Segurança

- Certifique-se de que o `NODE_ENV` está definido como `production`
- A variável `DISABLE_DEV_ROUTES` deve estar como `true`
- Verifique se as rotas de desenvolvimento estão bloqueadas via middleware
- Todas as credenciais sensíveis devem ser diferentes das usadas em desenvolvimento

### 5. Deploy via Docker (Alternativa)

Se preferir usar Docker:

```bash
# Construir a imagem
docker build -t fantasystore:prod .

# Executar o contêiner
docker run -d -p 3000:3000 --name fantasystore --env-file .env.production fantasystore:prod
```

### 6. Verificações Finais

- Confirme que a aplicação está funcionando corretamente em `https://fantasystore.com.br`
- Verifique se a conexão é segura (HTTPS)
- Teste o processo de compra
- Confirme que os emails estão sendo enviados corretamente

### 7. Manutenção

Para atualizar a aplicação:

```bash
# Puxar alterações
git pull

# Reinstalar dependências e reconstruir
npm run prepare-deploy

# Reiniciar o servidor
pm2 restart fantasystore
```

## Suporte

Para questões técnicas ou problemas no deploy, entre em contato com a equipe de desenvolvimento.

## Requisitos para Produção

Antes de implantar em produção, verifique as seguintes recomendações críticas de segurança:

### 1. Credenciais e Variáveis de Ambiente

✅ Verifique se todas as credenciais sensíveis foram movidas para variáveis de ambiente:
- MongoDB URI: Nunca use a string de conexão de desenvolvimento em produção
- JWT Secret: Gere um novo segredo forte para produção
- Mercado Pago: Use o token de produção, nunca o de testes

### 2. Segurança dos Logs

✅ Certifique-se de que o código não está logando informações sensíveis:
- As credenciais nos logs foram removidas
- Em produção, apenas erros serão logados (INFO e DEBUG são desativados)
- Tokens e senhas são automaticamente sanitizados pelo sistema de log

### 3. Lista de Verificação Final

Antes de publicar em produção, rode esta checklist:

```bash
# 1. Verifique se .env não está sendo enviado ao repositório
grep -v "^#" .env

# 2. Certifique-se que todas as variáveis de ambiente estão configuradas
echo "MONGODB_URI: $MONGODB_URI"
echo "JWT_SECRET: [configurado: $([ -n "$JWT_SECRET" ] && echo "sim" || echo "não")]" 
echo "MP_ACCESS_TOKEN: [configurado: $([ -n "$MP_ACCESS_TOKEN" ] && echo "sim" || echo "não")]"

# 3. Verifique se as credenciais de produção são diferentes das de desenvolvimento
# (Compare manualmente com o que está no .env de desenvolvimento)
```

### 4. Sistema de Revogação de Tokens

✅ Sistema de revogação de tokens atualizado:
- Foi implementada a integração com Redis para armazenamento persistente de tokens revogados em produção
- Em desenvolvimento, é usado um armazenamento em memória automaticamente (sem necessidade de Redis)
- A implementação detecta automaticamente o ambiente cliente/servidor e usa o método apropriado
- O código foi otimizado para funcionar corretamente com o Next.js App Router

**Configuração do Redis:**

Para configurar o Redis para armazenamento de tokens revogados em produção, adicione as seguintes variáveis de ambiente:

```
# Opção 1: URL completa (recomendado)
REDIS_URL=redis://usuario:senha@seu-host:6379

# Opção 2: Configuração separada
REDIS_HOST=seu-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha
```

**Importante:**
- Redis é usado apenas no ambiente de produção e apenas no lado do servidor
- Em ambiente de desenvolvimento, o sistema automaticamente usa armazenamento em memória
- Não é necessário configurar Redis para desenvolvimento ou testes
