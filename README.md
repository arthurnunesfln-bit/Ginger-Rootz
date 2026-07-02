# Ginger Assistant

App de gestão para a Ginger Rootz (bebida fermentada artesanal de gengibre), com o assistente por chat como interface principal.

Este pacote é uma versão **independente e publicável** do protótipo que foi testado dentro do Claude: mesma interface e as mesmas telas (Assistente, Início, Pedidos, Entregas, Clientes, Financeiro, Estoque, Produção, Revendedores, Agenda, Configurações), mas agora preparada para rodar no seu próprio domínio, fora do Claude.

## O que muda em relação à versão testada no Claude

| | Versão no Claude (artifact) | Esta versão (projeto publicável) |
|---|---|---|
| Onde roda | Só dentro de uma conversa no Claude | No seu próprio site/domínio |
| Onde ficam os dados | Armazenamento do Claude | `localStorage` do navegador (fica salvo no aparelho/navegador que você usar) |
| Como o assistente entende as mensagens | Chama a IA diretamente do navegador | Chama uma função de backend própria (`/api/assistant`), que guarda sua chave de API em segurança no servidor |

**Importante:** como os dados ficam no `localStorage` do navegador, eles são por aparelho/navegador — se você abrir em outro celular ou limpar os dados do navegador, não vai ver o mesmo histórico. Para sincronizar entre vários aparelhos (por exemplo, celular e computador), o próximo passo natural é adicionar um banco de dados de verdade (ver seção "Próximos passos" no fim).

## Rodando na sua máquina (opcional, para testar antes de publicar)

Pré-requisitos: [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
npm install
cp .env.example .env
# edite o .env e cole sua chave da Anthropic (veja abaixo como conseguir uma)
npm install -g vercel   # só na primeira vez
vercel dev              # roda o front-end junto com a função /api/assistant
```

Se você só quiser ver as telas (sem o assistente por IA funcionando), basta `npm run dev` — mais rápido, mas o chat vai dar erro ao tentar interpretar mensagens, já que a função de backend não sobe com o `vite dev` sozinho.

## Publicando de verdade (recomendado: Vercel)

A Vercel é o caminho mais simples porque entende automaticamente tanto o front-end (Vite) quanto a função de backend (pasta `api/`), sem configuração extra.

1. Crie uma conta em [vercel.com](https://vercel.com) (dá para entrar com GitHub).
2. Suba este projeto para um repositório no GitHub (ou peça para um desenvolvedor/o Claude Code fazer isso por você).
3. Na Vercel, clique em **Add New → Project** e escolha o repositório.
4. Antes de publicar, vá em **Environment Variables** e adicione:
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: sua chave da API da Anthropic (veja abaixo como conseguir)
5. Clique em **Deploy**. Em cerca de um minuto você recebe um endereço tipo `ginger-assistant.vercel.app`.
6. Abra esse endereço no celular e toque em **"Adicionar à tela de início"** no menu do navegador — vai funcionar como um app, com ícone e tudo, sem precisar passar pela App Store/Play Store.

### Como conseguir a chave da API (ANTHROPIC_API_KEY)

1. Acesse [console.anthropic.com](https://console.anthropic.com).
2. Crie uma conta (é separada da conta do claude.ai).
3. Em **Settings → API Keys**, crie uma nova chave.
4. Adicione um pouco de crédito na conta (é cobrado por uso — cada mensagem do assistente custa uma fração de centavo).
5. Cole essa chave na variável de ambiente `ANTHROPIC_API_KEY`, como no passo 4 acima.

**Nunca** coloque essa chave direto no código ou no front-end — é por isso que o projeto já vem com a função `api/assistant.js`, que mantém a chave só no servidor.

## Estrutura do projeto

```
ginger-assistant-app/
├── api/
│   └── assistant.js       # backend que fala com a Anthropic (guarda a chave em segredo)
├── src/
│   ├── App.jsx             # todo o aplicativo (telas, dados, lógica)
│   ├── main.jsx             # ponto de entrada do React
│   └── index.css            # Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

Praticamente todo o app está em `src/App.jsx` — é um único arquivo grande, mas organizado por seções comentadas (utilitários, dados de exemplo, cada tela, e o componente principal `App` no final).

## Próximos passos sugeridos (não incluídos nesta versão)

O documento original já previa isso como evolução, não como parte do MVP:

- **Banco de dados real** (ex.: Postgres via Neon/Supabase) no lugar do `localStorage`, para os dados não ficarem presos a um único navegador e permitirem login da empreendedora em qualquer aparelho.
- **Autenticação** (hoje o app não tem login — qualquer pessoa com o link acessa os dados daquele navegador).
- **Integração com WhatsApp Business API**, para o assistente funcionar dentro do WhatsApp de verdade, não só numa tela parecida.
- **Transcrição de áudio** para o botão de microfone funcionar.
- **Google Calendar, Pix, exportação para planilha**, como já estava mapeado no documento de especificação original.

Cada um desses itens é um projeto à parte; o mais impactante para "uso real no dia a dia" costuma ser o banco de dados + autenticação, porque aí os dados passam a ser seus de verdade, acessíveis de qualquer aparelho, com backup automático.
