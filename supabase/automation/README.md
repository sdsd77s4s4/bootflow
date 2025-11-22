Automação: migração e testes para `cobrancas`

Conteúdo desta pasta:
- `auto_migration.sql` — SQL para rodar no editor SQL do Supabase. Faz `DROP NOT NULL`, cria função trigger, cria trigger e cria a policy de INSERT.
- `run_tests.ps1` — script PowerShell não interativo para obter token via `/auth/v1/token`, inserir uma cobrança e listar cobranças.
- `run_tests.sh` — script bash que faz o mesmo (usa `curl` e `jq`).

Instruções rápidas

1) Rodar o SQL (no painel Supabase → SQL Editor):
   - Abra `supabase/automation/auto_migration.sql` e execute tudo.
   - Isso permite novas inserções sem falhar no NOT NULL, cria o trigger que popula `cliente_profile_id` a partir do e-mail e cria a policy de INSERT.

2) Rodar os testes localmente (PowerShell ou Bash):
   - Configure variáveis de ambiente (não deixe service_role exposto):
     - `PROJECT_URL` = https://<SEU_PROJETO>.supabase.co
     - `ANON_KEY` = <SUA_ANON_PUBLIC_KEY>
     - `TEST_EMAIL` = cliente@test.local
     - `TEST_PASSWORD` = Senha123!

   PowerShell (Windows):
     pwsh ./supabase/automation/run_tests.ps1

   Bash (Linux / Git Bash / WSL):
     chmod +x ./supabase/automation/run_tests.sh
     ./supabase/automation/run_tests.sh

3) Após validar:
   - Se os testes mostrarem que `cliente_profile_id` está sendo preenchido, reforce a coluna:
     ALTER TABLE public.cobrancas ALTER COLUMN cliente_profile_id SET NOT NULL;
   - Atualize ou remova policies que fazem referência a `cliente_id` e, quando seguro, DROP COLUMN `cliente_id`.

Segurança
- Nunca exponha o `service_role` key em scripts públicos ou no browser.
- Os scripts usam o `anon` key para operações de cliente. Para alterações DDL no banco use o editor SQL do Supabase executado com uma conta com privilégios.

Se quiser, eu posso:
- (A) Commitar estes arquivos no repositório (faço o patch agora), ou
- (B) Apenas deixá-los aqui para você copiar/rodar.  

Observação: eu não posso executar comandos no seu ambiente Supabase nem abrir um terminal no seu computador por você. O que eu fiz foi preparar tudo para que você execute de forma não-interativa localmente ou no painel Supabase.