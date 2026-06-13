## Problema

Inserir manualmente em `user_roles` é frágil:
- `user_id` é UUID, não email → falha óbvia
- `role` é enum (`admin`/`moderator`/`user`) → `editor` não existe
- O trigger `handle_new_user` está definido mas **não está ligado** a `auth.users` (não há triggers no DB), por isso o `profiles` também não está a ser criado nos signups

## Correção

### 1. Resolver o teu acesso agora
Inserir a role `admin` na tua conta via SQL com lookup por email (sem precisares de copiar UUIDs).

### 2. Automatizar para o futuro (migration)
- Criar trigger `on_auth_user_created` em `auth.users` → executa `handle_new_user()` (cria `profiles` automaticamente)
- Criar função `bootstrap_first_admin()` + trigger em `public.profiles`: o **primeiro** utilizador a registar-se recebe automaticamente role `admin`. Os seguintes recebem role `user` por defeito
- Assim, novos admins podem ser promovidos pelo admin existente via UI (ponto 3)

### 3. UI no backoffice para gerir roles
Nova página `/admin/users` (admin-only) que lista utilizadores e permite:
- Atribuir/remover role `admin` ou `moderator`
- Sem precisar de mexer em SQL nunca mais

### 4. Limpar instruções obsoletas
Remover o aviso "primeira conta precisa de role admin manualmente" em `/auth` (passa a ser automático).

## Fora de scope
- Convites por email para novos admins (pode vir depois)
- Histórico de alterações de roles
