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
fantasy-cheats/
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
