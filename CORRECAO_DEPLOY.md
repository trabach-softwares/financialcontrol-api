# 🚨 CORREÇÃO URGENTE - Deploy Necessário

## ❌ Problema Identificado

O teste automatizado falhou com o erro:
```
{"success":false,"data":null,"message":"Usuário não encontrado"}
```

## 🔍 Causa Raiz

O arquivo `src/services/paymentService.js` estava usando `supabase` (cliente com RLS) em vez de `supabaseAdmin`.

Quando o paymentService tentava buscar dados do usuário, o RLS (Row Level Security) do Supabase bloqueava a query porque não havia contexto de autenticação no servidor.

## ✅ Correção Aplicada

**Arquivo:** `src/services/paymentService.js`

**Linha 9 - ANTES:**
```javascript
import { supabase } from '../config/supabase.js';
```

**Linha 9 - DEPOIS:**
```javascript
import { supabaseAdmin as supabase } from '../config/supabase.js';
```

## 🚀 O que Fazer Agora

### 1. Verificar as Alterações Locais

```bash
git status
git diff src/services/paymentService.js
```

### 2. Fazer Commit das Alterações

```bash
git add src/services/paymentService.js
git commit -m "fix: usar supabaseAdmin no paymentService para evitar bloqueio RLS"
```

### 3. Push para o Repositório

```bash
git push origin feature/novas-alteracoes
```

### 4. Deploy em Produção

**Se estiver usando Vercel:**
```bash
vercel --prod
```

**Se estiver usando Render/Railway:**
- O deploy acontece automaticamente após o push
- Aguarde 2-3 minutos para o build completar
- Verifique os logs de build para garantir sucesso

### 5. Testar Novamente

Após o deploy, execute:
```bash
./test-payment.sh
```

## 🔍 Por Que Isso Aconteceu?

O Supabase usa **Row Level Security (RLS)** para proteger os dados. Existem dois clientes:

1. **`supabase`** - Cliente com RLS ativo
   - Usado para requisições do frontend/usuário
   - Respeita políticas de segurança
   - Só vê dados permitidos pelo RLS

2. **`supabaseAdmin`** - Cliente admin sem RLS
   - Usado para operações do backend/servidor
   - Bypass das políticas RLS
   - Acesso total ao banco de dados

O `paymentService` precisa buscar dados de usuários e planos independente do contexto de autenticação, então **DEVE** usar `supabaseAdmin`.

## ✅ Checklist de Deploy

- [ ] Verificar que `src/services/paymentService.js` usa `supabaseAdmin`
- [ ] Fazer commit da alteração
- [ ] Push para repositório
- [ ] Aguardar deploy completar
- [ ] Verificar logs de build (sem erros)
- [ ] Executar `./test-payment.sh` novamente
- [ ] Verificar que pagamento é criado com sucesso

## 🐛 Se Ainda Não Funcionar

1. **Verificar logs da API em produção:**
   ```bash
   # Vercel
   vercel logs https://api.financialcontrol.com.br
   
   # Render/Railway
   # Acessar dashboard → Logs
   ```

2. **Procurar por:**
   - Erros de autenticação
   - Erros de conexão com Supabase
   - Erros do Asaas API

3. **Verificar variáveis de ambiente:**
   - `SUPABASE_SERVICE_ROLE_KEY` está configurada?
   - `ASAAS_API_KEY` está correta?
   - `ASAAS_ENVIRONMENT` está como `production`?

## 📞 Outras Possíveis Causas

Se após o deploy ainda houver erro "Usuário não encontrado":

### 1. Verificar estrutura da tabela `users`

Execute no Supabase SQL Editor:
```sql
-- Ver estrutura da tabela
\d users

-- Ver se o usuário de teste existe
SELECT id, email, name, created_at 
FROM users 
WHERE email LIKE 'teste-%@exemplo.com'
ORDER BY created_at DESC 
LIMIT 5;
```

### 2. Verificar RLS na tabela `users`

```sql
-- Ver políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### 3. Testar query manualmente

```sql
-- Tentar buscar o usuário com o ID do erro
SELECT * FROM users WHERE id = '3f0cfd7e-8f27-49e8-8aee-49c652b96640';
```

## 🎯 Resultado Esperado

Após o deploy e correção, o teste deve mostrar:

```
[4/8] Criando pagamento PIX...
   Aguardando 2 segundos para sincronização...
   Enviando requisição...
✅ Pagamento PIX criado com sucesso
   Payment ID: abc-123
   Asaas Payment ID: pay_xyz789
   Status: PENDING
   Valor: R$ 0

📱 PAGUE O PIX PARA CONTINUAR O TESTE
```

## 📝 Nota Importante

Esta correção é **crítica** para o funcionamento de:
- ✅ Criação de pagamentos
- ✅ Processamento de webhooks
- ✅ Ativação de planos
- ✅ Consulta de status de pagamentos

**TODOS os serviços que acessam o banco de dados diretamente devem usar `supabaseAdmin`!**

## ✅ Após Deploy

Documente a correção:
```bash
echo "✅ $(date): Corrigido paymentService para usar supabaseAdmin" >> CHANGELOG.md
```

---

**Pronto!** Agora faça o deploy e teste novamente! 🚀
