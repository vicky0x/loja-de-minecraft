FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Construir a aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ambiente definido como produção
ENV NODE_ENV production
# Variáveis de ambiente são injetadas no tempo de execução pelos segredos do Docker ou seu orquestrador

# Construir a aplicação
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Criar usuário não-root para maior segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copiar build e arquivos estáticos
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expor a porta que a aplicação vai usar
EXPOSE 3000

# Definir variáveis necessárias
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Iniciar a aplicação
CMD ["node", "server.js"] 