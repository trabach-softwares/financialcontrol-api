# 🚀 Deploy da API no Render

Este guia te ajudará a fazer o deploy da Financial Control API no Render.

## 📋 Pré-requisitos

1. ✅ Conta no [Render](https://render.com)
2. ✅ Repositório no GitHub com o código da API
3. ✅ Banco de dados Supabase configurado
4. ✅ Variáveis de ambiente prontas

## 🛠️ Configuração Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que seu código está no GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Criar Serviço no Render

1. **Acesse o Render**: https://render.com
2. **Clique em "New +"** → **"Web Service"**
3. **Conecte seu repositório GitHub**
4. **Configure o serviço**:

#### Configurações Básicas:
- **Name**: `financialcontrol-api`
- **Region**: `Oregon (US West)` ou `Frankfurt (EU Central)`
- **Branch**: `main`
- **Runtime**: `Node`

#### Configurações de Build:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Configurar Variáveis de Ambiente

Na seção **Environment**, adicione estas variáveis:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Ambiente de produção |
| `PORT` | `10000` | Porta padrão do Render |
| `SUPABASE_URL` | `sua_url_supabase` | URL do seu projeto Supabase |
| `SUPABASE_ANON_KEY` | `sua_anon_key` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `sua_service_key` | Chave de serviço do Supabase |
| `JWT_SECRET` | `seu_jwt_secret_seguro` | Chave secreta JWT (32+ caracteres) |
| `JWT_EXPIRES_IN` | `7d` | Tempo de expiração do token |
| `ALLOWED_ORIGINS` | `https://seudominio.com` | Domínios permitidos para CORS |

### 4. Deploy Automático

O Render fará o deploy automaticamente. Você verá:

1. 🔄 **Building**: Instalando dependências
2. 🚀 **Deploying**: Iniciando a aplicação
3. ✅ **Live**: API disponível online

### 5. Configurar Domínio Personalizado (Opcional)

1. **Vá em Settings** do seu serviço
2. **Custom Domains** → **Add Custom Domain**
3. **Configure seu DNS** apontando para o Render

## 🔧 Configurações Avançadas

### Health Check
O Render verificará automaticamente o endpoint `/health` da sua API.

### Auto-Deploy
Configurado para fazer deploy automático a cada push na branch `main`.

### Logs
Acesse os logs em tempo real no dashboard do Render.

## 🌍 URLs da API

Após o deploy, sua API estará disponível em:

- **Render URL**: `https://financialcontrol-api.onrender.com`
- **Health Check**: `https://financialcontrol-api.onrender.com/health`
- **API Base**: `https://financialcontrol-api.onrender.com/api`

## 📡 Testando a API

### Usando cURL:
```bash
# Health check
curl https://financialcontrol-api.onrender.com/health

# Listar planos
curl https://financialcontrol-api.onrender.com/api/plans

# Registrar usuário
curl -X POST https://financialcontrol-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste User",
    "email": "teste@exemplo.com", 
    "password": "MinhaSenh@123!"
  }'
```

## 🔒 Configurações de Segurança

### 1. Supabase RLS (Row Level Security)
Certifique-se de que as políticas RLS estão configuradas no Supabase.

### 2. CORS
Configure os domínios permitidos na variável `ALLOWED_ORIGINS`.

### 3. Rate Limiting
O rate limiting está configurado no código (100 requests/15min por IP).

## 📊 Monitoramento

### 1. Logs do Render
- Acesse **Logs** no dashboard
- Configure alertas de erro

### 2. Uptime Monitoring
- Configure monitoring externo (UptimeRobot, Pingdom)
- Endpoint: `/health`

### 3. Performance
- Monitor response times
- Configure alertas de performance

## 🔄 CI/CD Automático

O deploy é automático via GitHub:

1. **Push para main** → **Deploy automático**
2. **Pull Request** → **Preview deploy** (opcional)
3. **Rollback** → Disponível no dashboard

## 🆘 Troubleshooting

### Erro de Build:
```bash
# Verificar dependências
npm install
npm start
```

### Erro de Conexão com Supabase:
- ✅ Verificar URLs e chaves
- ✅ Confirmar permissões no Supabase
- ✅ Testar localmente primeiro

### Erro de CORS:
- ✅ Configurar `ALLOWED_ORIGINS`
- ✅ Verificar headers de requisição

### Timeout de Cold Start:
O Render pode ter cold starts no plano gratuito. Para produção, considere:
- **Plano pago** (sem cold starts)
- **Keep-alive** via ping externo

## 💰 Custos

### Plano Gratuito:
- ✅ 750 horas/mês
- ⚠️ Cold starts após inatividade
- ⚠️ Limitações de CPU/RAM

### Plano Pago ($7/mês):
- ✅ Sem cold starts
- ✅ Mais recursos
- ✅ SSL personalizado

## 🔗 Links Úteis

- [Render Docs](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
- [Supabase Docs](https://supabase.com/docs)

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs no Render
2. Teste localmente primeiro
3. Consulte a documentação oficial