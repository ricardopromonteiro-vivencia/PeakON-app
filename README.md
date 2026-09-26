# PeakON MVP 🚀

O teu MVP de gestão de treinos para Personal Trainers! Uma aplicação mobile-first, extremamente rápida (< 3 taps por ação principal) e com interface limpa e elegante (SaaS Style).

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + Zustand
- **Backend / Database**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router DOM

## Setup Local
1. Clona ou descobre o repositório.
2. Corre `npm install` na pasta base.
3. Renomeia `.env.template` para `.env` e preenche as tuas variáveis.
4. Corre `npm run dev`.

## Configuração do Supabase
1. Cria o projeto no Supabase.
2. Abre o **SQL Editor** no painel da plataforma.
3. Copia o conteúdo inteiro do ficheiro `supabase_schema.sql` que se encontra na raiz e executa-o no editor para criar todas as tabelas e regras de segurança (RLS).
4. No menu **Storage**, cria um novo bucket manual chamado `photos`.
5. Garante que os teus utilizadores autenticados podem interagir com a DB e o Storage (as rules básicas estão no SQL, mas o bucket precisa de RLS rules no painel do Supabase -> Storage Policies -> Create policy).

## Instruções de Deploy no Netlify
1. Acede ao painel do [Netlify](https://app.netlify.com/) e clica em **Add new site** > **Import an existing project**.
2. Liga o repositório ao qual enviaste este projeto.
3. As definições padrão devem ser detetadas automaticamente pelo Vite, mas caso não aconteça:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Expande os **Advanced build settings** para adicionar variáveis de ambiente. Tens de introduzir a `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Clica em **Deploy site** 🎉! Recomendamos também que vás depois a Site settings > Build & deploy > Continuous Deployment para garantires que um push na branch atualize logo o site.
