# GitHub Copilot Instructions - Financial Control API

## 🎯 Contexto do Projeto

**Nome do Projeto:** Financial Control API  
**Linguagem Principal:** JavaScript (ES6+ / ESM)  
**Runtime:** Node.js 18+  
**Framework Principal:** Express.js 4.18+  
**Gerenciador de Dependências:** npm  
**Banco de Dados:** PostgreSQL (via Supabase)  
**Cloud Provider:** Supabase (Backend as a Service)  
**Tipo de Aplicação:** REST API para SaaS de Controle Financeiro

### Principais Tecnologias

- **Express.js** - Framework web minimalista
- **Supabase** - PostgreSQL + Auth + Storage + RLS
- **JWT** - Autenticação via JSON Web Tokens
- **bcryptjs** - Hash de senhas
- **Axios** - Cliente HTTP para integração com APIs externas
- **Multer** - Upload de arquivos (avatares)
- **ExcelJS & PDFKit** - Geração de relatórios
- **date-fns** - Manipulação de datas
- **Helmet** - Segurança HTTP headers
- **Morgan** - Logging HTTP
- **Celebrate** - Validação de requisições
- **Express Rate Limit** - Rate limiting e proteção contra abusos

### Bibliotecas de Teste

- **Jest** - Framework de testes
- **Supertest** - Testes de API HTTP

---

## 📂 Estrutura de Pastas do Projeto

```
financialcontrol-api/
├── .github/                        # Configurações GitHub
│   └── copilot-instructions.md     # Este arquivo
├── migrations/                      # Migrações e scripts SQL
│   ├── 001_create_payments_table.sql
│   ├── 002_add_asaas_customer_id_to_users.sql
│   ├── 003_add_plan_status_to_users.sql
│   ├── 006_create_subscriptions.sql       # ⭐ NOVO: Tabela de assinaturas
│   ├── 007_add_subscription_fields_to_users.sql # ⭐ NOVO: Campos de assinatura em users
│   ├── admin_queries.sql
│   └── README.md
├── scripts/                         # Scripts auxiliares de deploy
│   └── deploy-render.sh
├── src/                            # Código-fonte principal
│   ├── app.js                      # Configuração do Express
│   ├── server.js                   # Entry point da aplicação
│   ├── config/                     # Configurações e clientes
│   │   ├── supabase.js            # Cliente Supabase
│   │   ├── jwt.js                 # Configuração JWT
│   │   └── asaas.js               # Cliente API Asaas (pagamentos)
│   ├── controllers/               # Controladores (camada de apresentação)
│   │   ├── accountController.js
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── dashboardController.js
│   │   ├── paymentController.js
│   │   ├── planController.js
│   │   ├── planLimitsController.js
│   │   ├── publicPlanController.js
│   │   ├── reportController.js
│   │   ├── subscriptionController.js # ⭐ NOVO: Controller de assinaturas
│   │   ├── transactionController.js
│   │   ├── userController.js
│   │   └── userProfileController.js
│   ├── middleware/                # Middlewares customizados
│   │   ├── auth.js                # Autenticação JWT
│   │   ├── planLimits.js          # Verificação de limites do plano
│   │   ├── rateLimiter.js         # Rate limiting básico
│   │   └── rateLimiterAdvanced.js # Rate limiting avançado
│   ├── routes/                    # Definição de rotas
│   │   ├── accountRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── planLimitsRoutes.js
│   │   ├── planRoutes.js
│   │   ├── publicPlanRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── subscriptionRoutes.js  # ⭐ NOVO: Rotas de assinaturas
│   │   ├── transactionRoutes.js
│   │   ├── userProfileRoutes.js
│   │   ├── userRoutes.js
│   │   └── webhookRoutes.js
│   ├── services/                  # Lógica de negócio
│   │   ├── accountService.js
│   │   ├── adminService.js
│   │   ├── authService.js
│   │   ├── categoriesService.js
│   │   ├── dashboardService.js
│   │   ├── paymentService.js
│   │   ├── planLimitsService.js
│   │   ├── planService.js
│   │   ├── reportService.js
│   │   ├── subscriptionService.js # ⭐ NOVO: Assinaturas recorrentes
│   │   ├── transactionService.js
│   │   └── userService.js
│   ├── utils/                     # Utilitários e helpers
│   │   ├── response.js            # Padronização de respostas HTTP
│   │   ├── dateValidation.js      # Validação e manipulação de datas
│   │   └── planFeatures.js        # Features dos planos
│   ├── docs/                      # Documentação técnica
│   │   ├── API_DOCS.md
│   │   ├── DATABASE.md
│   │   ├── DEPLOYMENT.md
│   │   ├── DEPLOYMENT_RENDER.md
│   │   └── QUICK_START.md
│   └── jobs/                      # Jobs e crons (futuros)
├── uploads/                       # Arquivos enviados pelos usuários
│   └── avatars/                   # Avatares de usuários
├── package.json                   # Dependências e scripts
├── .env                           # Variáveis de ambiente (não versionado)
├── vercel.json                    # Config deploy Vercel
├── render.yaml                    # Config deploy Render
└── README.md                      # Documentação principal
```

---

## 🏗️ Arquitetura do Projeto

### Padrão Arquitetural: MVC (Model-View-Controller) com Services

A aplicação segue uma arquitetura em camadas bem definidas:

1. **Routes** (Roteamento) - Define os endpoints HTTP e suas validações
2. **Controllers** (Controladores) - Recebe requisições, valida entrada, chama services
3. **Services** (Serviços) - Contém a lógica de negócio e acessa o banco
4. **Middleware** - Intercepta requisições para autenticação, autorização e rate limiting
5. **Utils** - Funções auxiliares reutilizáveis

### Fluxo de Requisição

```
Cliente HTTP
    ↓
[Express Middleware] → Helmet, CORS, Morgan, JSON Parser
    ↓
[Custom Middleware] → authenticateToken, isAdmin, rateLimiter, planLimits
    ↓
[Routes] → Define endpoints e validações
    ↓
[Controllers] → Valida entrada, chama service, retorna resposta
    ↓
[Services] → Lógica de negócio, acessa Supabase/APIs externas
    ↓
[Supabase/External APIs] → Banco de dados, autenticação, storage
    ↓
[Response Utils] → Padroniza resposta JSON
    ↓
Cliente HTTP
```

---

## 🎨 Padrões de Código

### Idiomas

- **Código (variáveis, funções, classes):** Inglês (camelCase)
- **Comentários:** Português
- **Mensagens de erro para usuário:** Português
- **Logs internos:** Português
- **Commits:** Português, tempo presente, modo imperativo

### Exemplos de Nomenclatura

```javascript
// ✅ CORRETO
const userId = req.user.id;
const categories = await categoriesService.list(userId);
console.log('[auth] token verificado com sucesso');
throw new Error('Categoria não encontrada');

// ❌ INCORRETO
const user_id = req.user.id; // snake_case não usado
const categorias = await categoriesService.list(userId); // português no código
console.log('[auth] token verified successfully'); // inglês em logs internos
throw new Error('Category not found'); // inglês em mensagem de usuário
```

---

## 📋 Tabela de Nomenclatura por Tipo de Componente

| Tipo | Padrão | Exemplo | Localização |
|------|--------|---------|-------------|
| **Route** | `*Routes.js` | `categoryRoutes.js` | `src/routes/` |
| **Controller** | `*Controller.js` | `categoryController.js` | `src/controllers/` |
| **Service** | `*Service.js` | `categoriesService.js` | `src/services/` |
| **Middleware** | `*.js` (descritivo) | `auth.js`, `planLimits.js` | `src/middleware/` |
| **Config** | `*.js` (descritivo) | `supabase.js`, `jwt.js` | `src/config/` |
| **Util** | `*.js` (descritivo) | `response.js`, `dateValidation.js` | `src/utils/` |
| **Migration SQL** | `NNN_descricao.sql` | `001_create_payments_table.sql` | `migrations/` |
| **Script Shell** | `*.sh` (kebab-case) | `deploy-render.sh` | `scripts/` |
| **Variáveis** | camelCase | `userId`, `maxTransactions` | Todos os arquivos |
| **Constantes** | UPPER_SNAKE_CASE | `JWT_SECRET`, `MAX_RETRIES` | Configs e envs |
| **Funções/Métodos** | camelCase | `createCategory()`, `validateToken()` | Todos os arquivos |
| **Arquivos de Docs** | UPPER_SNAKE_CASE.md | `API_DOCS.md`, `QUICK_START.md` | Raiz e `docs/` |

---

## 🧩 Estrutura de Pacotes (Camadas)

### 1. Routes (`src/routes/`)
Define os endpoints HTTP, aplica middlewares de autenticação e validação.

### 2. Controllers (`src/controllers/`)
Recebe a requisição HTTP, extrai dados do `req`, chama o service apropriado e retorna resposta padronizada.

### 3. Services (`src/services/`)
Contém toda a lógica de negócio, acessa o banco de dados via Supabase, faz validações de regras e dispara exceções quando necessário.

### 4. Middleware (`src/middleware/`)
Intercepta requisições para autenticação, autorização, rate limiting e verificação de limites do plano.

### 5. Config (`src/config/`)
Configuração de clientes externos (Supabase, JWT, Asaas).

### 6. Utils (`src/utils/`)
Funções auxiliares reutilizáveis para padronização de respostas, validações e helpers.

---

## ⚠️ Exceções Customizadas

O projeto utiliza `throw new Error()` nativo do JavaScript com `error.status` e `error.data` customizados quando necessário.

| Situação | Mensagem de Erro | Status HTTP | Campo `error.data` |
|----------|------------------|-------------|---------------------|
| Categoria duplicada | "Categoria já existe" | 400 | null |
| Nome vazio | "Category name is required" | 400 | null |
| Limite do plano atingido | "Limite de categorias atingido..." | 403 | `{ current, limit, planName, upgradeRequired }` |
| Token JWT inválido | "Invalid or expired token" | 403 | null |
| Token JWT ausente | "Access token required" | 401 | null |
| Usuário não é admin | "Admin access required" | 403 | null |
| Credenciais inválidas | "Invalid credentials" | 401 | null |
| Usuário já existe | "User already exists" | 400 | null |
| Plano não encontrado | "Plano não encontrado ou inativo" | 404 | null |
| Pagamento não encontrado | "Pagamento não encontrado" | 404 | null |

### Como lançar exceção customizada

```javascript
// Exceção simples
throw new Error('Categoria não encontrada');

// Exceção com status HTTP customizado
const error = new Error('Acesso negado');
error.status = 403;
throw error;

// Exceção com dados adicionais
const error = new Error('Limite atingido');
error.status = 403;
error.data = {
  current: 10,
  limit: 10,
  planName: 'Free',
  upgradeRequired: true
};
throw error;
```

---

## 🔨 Padrões por Tipo de Componente

### 1. **Route** - Definição de Endpoints

#### Propósito
Define os endpoints HTTP da API, aplica middlewares de autenticação, autorização e validação.

#### Template Completo

```javascript
import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { checkResourceLimit } from '../middleware/planLimits.js';
import { resourceController } from '../controllers/resourceController.js';

const router = express.Router();

// Rotas públicas (sem autenticação)
router.get('/public', resourceController.listPublic);

// Rotas protegidas (requer autenticação)
router.get('/', authenticateToken, resourceController.list);
router.get('/:id', authenticateToken, resourceController.getById);
router.post('/', authenticateToken, checkResourceLimit, resourceController.create);
router.put('/:id', authenticateToken, resourceController.update);
router.delete('/:id', authenticateToken, resourceController.remove);

// Rotas administrativas (requer admin)
router.get('/admin/stats', authenticateToken, isAdmin, resourceController.getStats);

export default router;
```

#### Instruções para Criar Nova Route

1. Criar arquivo em `src/routes/` com nome `*Routes.js`
2. Importar `express` e criar `router`
3. Importar middlewares necessários (`authenticateToken`, `isAdmin`, etc)
4. Importar o controller correspondente
5. Definir endpoints seguindo padrão RESTful:
   - `GET /` - listar todos
   - `GET /:id` - buscar por ID
   - `POST /` - criar novo
   - `PUT /:id` - atualizar
   - `DELETE /:id` - deletar
6. Aplicar middlewares na ordem: `authenticateToken` → `isAdmin` (se necessário) → `checkLimit` (se necessário) → `controller.method`
7. Exportar `router` como default
8. Registrar no `src/app.js` com prefixo `/api/recurso`

---

### 2. **Controller** - Camada de Apresentação

#### Propósito
Recebe requisições HTTP, extrai e valida dados do `req`, chama o service apropriado, trata erros e retorna resposta padronizada.

#### Template Completo

```javascript
import { resourceService } from '../services/resourceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const resourceController = {
  /**
   * Lista todos os recursos do usuário
   */
  async list(req, res) {
    try {
      const userId = req.user.id;
      const resources = await resourceService.list(userId);
      return sendSuccess(res, resources, 'Recursos listados com sucesso');
    } catch (error) {
      console.error('[resourceController.list] erro:', error);
      return sendError(res, error.message || 'Erro ao listar recursos', error.status || 400);
    }
  },

  /**
   * Busca um recurso por ID
   */
  async getById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      if (!id) {
        return sendError(res, 'ID do recurso é obrigatório', 400);
      }
      
      const resource = await resourceService.getById(userId, id);
      
      if (!resource) {
        return sendError(res, 'Recurso não encontrado', 404);
      }
      
      return sendSuccess(res, resource, 'Recurso encontrado');
    } catch (error) {
      console.error('[resourceController.getById] erro:', error);
      return sendError(res, error.message || 'Erro ao buscar recurso', error.status || 400);
    }
  },

  /**
   * Cria um novo recurso
   */
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { name, description, category } = req.body;
      
      if (!name) {
        return sendError(res, 'Nome do recurso é obrigatório', 400);
      }
      
      const resource = await resourceService.create(userId, {
        name,
        description,
        category
      });
      
      return sendSuccess(res, resource, 'Recurso criado com sucesso', 201);
    } catch (error) {
      console.error('[resourceController.create] erro:', error);
      const statusCode = error.status || 400;
      return sendError(res, error.message || 'Erro ao criar recurso', statusCode, error.data);
    }
  },

  /**
   * Atualiza um recurso existente
   */
  async update(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, description, category } = req.body;
      
      if (!id) {
        return sendError(res, 'ID do recurso é obrigatório', 400);
      }
      
      const resource = await resourceService.update(userId, id, {
        name,
        description,
        category
      });
      
      return sendSuccess(res, resource, 'Recurso atualizado com sucesso');
    } catch (error) {
      console.error('[resourceController.update] erro:', error);
      return sendError(res, error.message || 'Erro ao atualizar recurso', error.status || 400);
    }
  },

  /**
   * Remove um recurso
   */
  async remove(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      if (!id) {
        return sendError(res, 'ID do recurso é obrigatório', 400);
      }
      
      await resourceService.remove(userId, id);
      return sendSuccess(res, null, 'Recurso removido com sucesso');
    } catch (error) {
      console.error('[resourceController.remove] erro:', error);
      return sendError(res, error.message || 'Erro ao remover recurso', error.status || 400);
    }
  }
};
```

#### Instruções para Criar Novo Controller

1. Criar arquivo em `src/controllers/` com nome `*Controller.js`
2. Importar o service correspondente
3. Importar `sendSuccess` e `sendError` de `utils/response.js`
4. Exportar objeto com métodos assíncronos
5. Cada método deve:
   - Receber `(req, res)` como parâmetros
   - Extrair `userId` de `req.user.id`
   - Extrair dados de `req.body`, `req.params`, `req.query`
   - Validar campos obrigatórios
   - Chamar o service apropriado dentro de `try/catch`
   - Retornar `sendSuccess()` em caso de sucesso
   - Retornar `sendError()` em caso de erro, passando `error.status` e `error.data` se disponíveis
   - Incluir log de erro com `console.error('[nomeController.metodo] erro:', error)`
6. Usar comentários JSDoc para documentar cada método

---

### 3. **Service** - Lógica de Negócio

#### Propósito
Contém toda a lógica de negócio, acessa o banco de dados via Supabase, valida regras de negócio, dispara exceções quando necessário.

#### Template Completo

```javascript
import { supabaseAdmin } from '../config/supabase.js';
import { planLimitsService } from './planLimitsService.js';

export const resourceService = {
  /**
   * Lista todos os recursos do usuário
   */
  async list(userId) {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('id, name, description, category, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[resourceService.list] erro ao buscar recursos:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Busca um recurso por ID
   */
  async getById(userId, resourceId) {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('id, name, description, category, created_at, updated_at')
      .eq('id', resourceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[resourceService.getById] erro ao buscar recurso:', error);
      throw error;
    }

    return data;
  },

  /**
   * Cria um novo recurso
   */
  async create(userId, payload) {
    const { name, description, category } = payload;

    // Validação de campos obrigatórios
    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      throw new Error('Nome do recurso é obrigatório');
    }

    // Verifica limite do plano
    const limitCheck = await planLimitsService.canCreateResource(userId);
    if (!limitCheck.allowed) {
      const error = new Error(
        `Limite de recursos atingido. Você tem ${limitCheck.current} de ${limitCheck.limit} recursos no plano ${limitCheck.planName}. Faça upgrade para criar mais recursos!`
      );
      error.status = 403;
      error.data = {
        current: limitCheck.current,
        limit: limitCheck.limit,
        planName: limitCheck.planName,
        upgradeRequired: true
      };
      throw error;
    }

    // Verifica duplicidade (se aplicável)
    const { data: existing } = await supabaseAdmin
      .from('resources')
      .select('id, name, description, category')
      .eq('user_id', userId)
      .ilike('name', trimmedName)
      .maybeSingle();

    if (existing) {
      throw new Error('Recurso com este nome já existe');
    }

    // Cria o recurso
    const { data, error } = await supabaseAdmin
      .from('resources')
      .insert([{
        user_id: userId,
        name: trimmedName,
        description: description?.trim() || null,
        category: category?.trim() || null
      }])
      .select('id, name, description, category, created_at, updated_at')
      .single();

    if (error) {
      console.error('[resourceService.create] erro ao criar recurso:', error);
      throw error;
    }

    return data;
  },

  /**
   * Atualiza um recurso existente
   */
  async update(userId, resourceId, payload) {
    const updateData = {};

    if (payload.name) {
      updateData.name = payload.name.trim();
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description?.trim() || null;
    }
    if (payload.category !== undefined) {
      updateData.category = payload.category?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('resources')
      .update(updateData)
      .eq('id', resourceId)
      .eq('user_id', userId)
      .select('id, name, description, category, created_at, updated_at')
      .single();

    if (error) {
      console.error('[resourceService.update] erro ao atualizar recurso:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Recurso não encontrado');
    }

    return data;
  },

  /**
   * Remove um recurso
   */
  async remove(userId, resourceId) {
    const { error } = await supabaseAdmin
      .from('resources')
      .delete()
      .eq('id', resourceId)
      .eq('user_id', userId);

    if (error) {
      console.error('[resourceService.remove] erro ao remover recurso:', error);
      throw error;
    }

    return true;
  }
};
```

#### Instruções para Criar Novo Service

1. Criar arquivo em `src/services/` com nome `*Service.js`
2. Importar `supabaseAdmin` de `config/supabase.js`
3. Importar outros services necessários (ex: `planLimitsService`)
4. Exportar objeto com métodos assíncronos
5. Cada método deve:
   - Receber `userId` como primeiro parâmetro (quando aplicável)
   - Validar dados de entrada
   - Fazer queries no Supabase usando `supabaseAdmin.from('tabela')`
   - Sempre usar `.select()` específico, nunca `.select('*')`
   - Sempre incluir `.eq('user_id', userId)` para garantir isolamento de dados
   - Verificar limites do plano antes de criar recursos (quando aplicável)
   - Lançar exceções com `throw new Error()` para situações de erro
   - Retornar dados ou `true` em caso de sucesso
   - Incluir logs de erro com `console.error('[nomeService.metodo] erro:', error)`
6. Usar comentários para documentar cada método

---

### 4. **Middleware** - Interceptadores

#### Propósito
Intercepta requisições HTTP para autenticação, autorização, rate limiting e verificação de limites do plano.

#### Template de Middleware de Autenticação

```javascript
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware de autenticação JWT
 * Valida o token e popula req.user com os dados do usuário
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.debug('[auth] requisição recebida', {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!authHeader
  });

  if (!token) {
    console.warn('[auth] token ausente');
    return sendError(res, 'Token de acesso é obrigatório', 401);
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    console.debug('[auth] token validado', {
      userId: decoded?.id,
      email: decoded?.email,
      role: decoded?.role
    });
    
    req.user = decoded;
    req.userId = decoded.id; // Compatibilidade
    next();
  } catch (error) {
    console.error('[auth] falha ao validar token:', error.message);
    return sendError(res, 'Token inválido ou expirado', 403);
  }
};

/**
 * Middleware de autorização admin
 * Verifica se o usuário tem role de admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    console.warn('[auth] acesso admin negado', { userId: req.user?.id });
    return sendError(res, 'Acesso administrativo necessário', 403);
  }
  next();
};
```

#### Template de Middleware de Limite de Plano

```javascript
import { planLimitsService } from '../services/planLimitsService.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware para verificar limite de criação de recursos
 */
export const checkResourceLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const limitCheck = await planLimitsService.canCreateResource(userId);
    
    if (!limitCheck.allowed) {
      console.warn('[planLimits] limite de recursos atingido', {
        userId,
        current: limitCheck.current,
        limit: limitCheck.limit,
        planName: limitCheck.planName
      });
      
      return sendError(
        res,
        `Limite de recursos atingido. Você tem ${limitCheck.current} de ${limitCheck.limit} recursos no plano ${limitCheck.planName}. Faça upgrade para criar mais!`,
        403,
        {
          current: limitCheck.current,
          limit: limitCheck.limit,
          planName: limitCheck.planName,
          upgradeRequired: true
        }
      );
    }
    
    next();
  } catch (error) {
    console.error('[planLimits] erro ao verificar limite:', error);
    return sendError(res, 'Erro ao verificar limite do plano', 500);
  }
};
```

#### Instruções para Criar Novo Middleware

1. Criar arquivo em `src/middleware/` com nome descritivo (ex: `auth.js`, `planLimits.js`)
2. Importar dependências necessárias
3. Criar função que recebe `(req, res, next)`
4. Executar validação/verificação necessária
5. Se validação falhar, chamar `sendError()` e retornar (NÃO chamar `next()`)
6. Se validação passar, chamar `next()` para continuar o fluxo
7. Incluir logs para debug e monitoramento
8. Exportar função com `export const nomeFuncao`

---

### 5. **Config** - Configurações e Clientes

#### Propósito
Configurar clientes de serviços externos (Supabase, JWT, APIs).

#### Template de Config Supabase

```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key são obrigatórios no .env');
}

// Cliente público (usa RLS do Supabase)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo (bypassa RLS - usar com cuidado!)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('[supabase] clientes inicializados');
```

#### Template de Config JWT

```javascript
import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

if (process.env.NODE_ENV === 'production' && jwtConfig.secret === 'default_secret_change_in_production') {
  console.error('[jwt] AVISO: usando JWT_SECRET padrão em produção!');
}

console.log('[jwt] configuração carregada', { expiresIn: jwtConfig.expiresIn });
```

#### Template de Config API Externa (Axios)

```javascript
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.EXTERNAL_API_URL;
const API_KEY = process.env.EXTERNAL_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error('Configuração da API externa ausente no .env');
}

export const externalApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 30000
});

// Interceptor de request para logging
externalApiClient.interceptors.request.use(
  (config) => {
    console.log('[externalApi] requisição', {
      method: config.method,
      url: config.url
    });
    return config;
  },
  (error) => {
    console.error('[externalApi] erro no request:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response para logging
externalApiClient.interceptors.response.use(
  (response) => {
    console.log('[externalApi] resposta', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('[externalApi] erro na resposta:', {
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

console.log('[externalApi] cliente inicializado');
```

#### Instruções para Criar Novo Config

1. Criar arquivo em `src/config/` com nome descritivo (ex: `supabase.js`, `jwt.js`)
2. Importar `dotenv` e chamar `dotenv.config()`
3. Carregar variáveis de ambiente necessárias
4. Validar se variáveis obrigatórias estão presentes
5. Criar e configurar cliente/objeto de configuração
6. Exportar cliente/config com `export const`
7. Incluir log de inicialização

---

### 6. **Utils** - Utilitários e Helpers

#### Propósito
Funções auxiliares reutilizáveis para padronização de respostas, validações e helpers diversos.

#### Template de Response Utils

```javascript
/**
 * Envia resposta de sucesso padronizada
 * @param {Object} res - Objeto response do Express
 * @param {*} data - Dados a retornar
 * @param {string} message - Mensagem de sucesso
 * @param {number} statusCode - Código HTTP (padrão 200)
 */
export const sendSuccess = (res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

/**
 * Envia resposta de erro padronizada
 * @param {Object} res - Objeto response do Express
 * @param {string} message - Mensagem de erro
 * @param {number} statusCode - Código HTTP (padrão 400)
 * @param {*} data - Dados adicionais (opcional)
 */
export const sendError = (res, message = 'Erro na operação', statusCode = 400, data = null) => {
  return res.status(statusCode).json({
    success: false,
    data,
    message
  });
};
```

#### Template de Validation Utils

```javascript
import { isValid, parseISO, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

/**
 * Valida se uma string é uma data válida no formato ISO
 * @param {string} dateString - String de data a validar
 * @returns {boolean} - true se válida
 */
export const isValidISODate = (dateString) => {
  if (!dateString) return false;
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed);
  } catch {
    return false;
  }
};

/**
 * Valida se data inicial é anterior à data final
 * @param {string} startDate - Data inicial ISO
 * @param {string} endDate - Data final ISO
 * @returns {boolean} - true se válida
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!isValidISODate(startDate) || !isValidISODate(endDate)) {
    return false;
  }
  
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  return isBefore(start, end) || start.getTime() === end.getTime();
};

/**
 * Normaliza data para início do dia (00:00:00)
 * @param {string} dateString - Data ISO
 * @returns {Date} - Data normalizada
 */
export const normalizeStartDate = (dateString) => {
  const parsed = parseISO(dateString);
  return startOfDay(parsed);
};

/**
 * Normaliza data para fim do dia (23:59:59)
 * @param {string} dateString - Data ISO
 * @returns {Date} - Data normalizada
 */
export const normalizeEndDate = (dateString) => {
  const parsed = parseISO(dateString);
  return endOfDay(parsed);
};
```

#### Instruções para Criar Novo Util

1. Criar arquivo em `src/utils/` com nome descritivo (ex: `dateValidation.js`, `formatters.js`)
2. Importar dependências necessárias
3. Criar funções puras (sem side effects)
4. Documentar cada função com JSDoc
5. Exportar funções com `export const`
6. Manter funções pequenas e com responsabilidade única

---

## 🧪 Templates de Teste

### Template de Teste de Controller

```javascript
import request from 'supertest';
import app from '../src/app.js';
import { supabaseAdmin } from '../src/config/supabase.js';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../src/config/jwt.js';

describe('ResourceController', () => {
  let authToken;
  let userId;
  let resourceId;

  beforeAll(async () => {
    // Cria usuário de teste
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      }])
      .select()
      .single();

    if (error) throw error;

    userId = user.id;
    authToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  });

  afterAll(async () => {
    // Limpa dados de teste
    await supabaseAdmin.from('resources').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
  });

  describe('POST /api/resources', () => {
    test('deve criar um novo recurso com sucesso', async () => {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recurso Teste',
          description: 'Descrição do teste',
          category: 'teste'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Recurso Teste');
      expect(response.body.message).toBe('Recurso criado com sucesso');

      resourceId = response.body.data.id;
    });

    test('deve retornar erro 400 quando nome estiver vazio', async () => {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          description: 'Descrição'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('obrigatório');
    });

    test('deve retornar erro 401 quando token não for fornecido', async () => {
      const response = await request(app)
        .post('/api/resources')
        .send({
          name: 'Teste',
          description: 'Descrição'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/resources', () => {
    test('deve listar recursos do usuário', async () => {
      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/resources/:id', () => {
    test('deve buscar recurso por ID', async () => {
      const response = await request(app)
        .get(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(resourceId);
    });

    test('deve retornar erro 404 quando recurso não existir', async () => {
      const response = await request(app)
        .get('/api/resources/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/resources/:id', () => {
    test('deve atualizar recurso com sucesso', async () => {
      const response = await request(app)
        .put(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recurso Atualizado',
          description: 'Nova descrição'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Recurso Atualizado');
    });
  });

  describe('DELETE /api/resources/:id', () => {
    test('deve deletar recurso com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removido');
    });
  });
});
```

### Template de Teste de Service

```javascript
import { resourceService } from '../src/services/resourceService.js';
import { supabaseAdmin } from '../src/config/supabase.js';

describe('ResourceService', () => {
  let userId;
  let resourceId;

  beforeAll(async () => {
    // Cria usuário de teste
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email: 'servicetest@example.com',
        password: 'hashedpassword',
        name: 'Service Test User'
      }])
      .select()
      .single();

    if (error) throw error;
    userId = user.id;
  });

  afterAll(async () => {
    // Limpa dados de teste
    await supabaseAdmin.from('resources').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
  });

  describe('create', () => {
    test('deve criar recurso com sucesso', async () => {
      const resource = await resourceService.create(userId, {
        name: 'Recurso Service',
        description: 'Teste de service',
        category: 'teste'
      });

      expect(resource).toHaveProperty('id');
      expect(resource.name).toBe('Recurso Service');
      expect(resource.description).toBe('Teste de service');

      resourceId = resource.id;
    });

    test('deve lançar erro quando nome estiver vazio', async () => {
      await expect(
        resourceService.create(userId, {
          name: '',
          description: 'Teste'
        })
      ).rejects.toThrow('obrigatório');
    });

    test('deve lançar erro quando recurso duplicado', async () => {
      await expect(
        resourceService.create(userId, {
          name: 'Recurso Service',
          description: 'Duplicado'
        })
      ).rejects.toThrow('já existe');
    });
  });

  describe('list', () => {
    test('deve listar recursos do usuário', async () => {
      const resources = await resourceService.list(userId);

      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0]).toHaveProperty('id');
      expect(resources[0]).toHaveProperty('name');
    });
  });

  describe('getById', () => {
    test('deve buscar recurso por ID', async () => {
      const resource = await resourceService.getById(userId, resourceId);

      expect(resource).not.toBeNull();
      expect(resource.id).toBe(resourceId);
      expect(resource.name).toBe('Recurso Service');
    });

    test('deve retornar null quando recurso não existe', async () => {
      const resource = await resourceService.getById(userId, '00000000-0000-0000-0000-000000000000');

      expect(resource).toBeNull();
    });
  });

  describe('update', () => {
    test('deve atualizar recurso com sucesso', async () => {
      const updated = await resourceService.update(userId, resourceId, {
        name: 'Recurso Atualizado Service',
        description: 'Descrição atualizada'
      });

      expect(updated.name).toBe('Recurso Atualizado Service');
      expect(updated.description).toBe('Descrição atualizada');
    });

    test('deve lançar erro quando nenhum campo for fornecido', async () => {
      await expect(
        resourceService.update(userId, resourceId, {})
      ).rejects.toThrow('Nenhum campo para atualizar');
    });
  });

  describe('remove', () => {
    test('deve remover recurso com sucesso', async () => {
      const result = await resourceService.remove(userId, resourceId);

      expect(result).toBe(true);

      // Verifica se realmente foi removido
      const resource = await resourceService.getById(userId, resourceId);
      expect(resource).toBeNull();
    });
  });
});
```

### Instruções para Criar Novos Testes

1. Criar arquivo em pasta `__tests__/` ou `tests/` com nome `*.test.js` ou `*.spec.js`
2. Importar `request` de `supertest` para testes de API
3. Importar componente a ser testado
4. Criar `describe` para agrupar testes relacionados
5. Usar `beforeAll` para setup de dados de teste
6. Usar `afterAll` para cleanup de dados de teste
7. Usar `test` ou `it` para cada caso de teste
8. Seguir padrão Arrange/Act/Assert:
   - **Arrange:** preparar dados
   - **Act:** executar ação
   - **Assert:** verificar resultado
9. Cobrir cenários de sucesso e falha
10. Usar matchers do Jest: `toBe`, `toEqual`, `toHaveProperty`, `toContain`, `toThrow`
11. Para testes de API, verificar `status`, `body.success`, `body.data`, `body.message`

---

## 📝 Padrão de Resposta HTTP

Todas as respostas da API seguem o formato JSON padronizado:

### Resposta de Sucesso

```json
{
  "success": true,
  "data": { "id": "123", "name": "Exemplo" },
  "message": "Operação realizada com sucesso"
}
```

### Resposta de Erro

```json
{
  "success": false,
  "data": null,
  "message": "Mensagem de erro explicativa"
}
```

### Resposta de Erro com Dados Adicionais

```json
{
  "success": false,
  "data": {
    "current": 10,
    "limit": 10,
    "planName": "Free",
    "upgradeRequired": true
  },
  "message": "Limite de recursos atingido"
}
```

---

## � Assinaturas Recorrentes (Subscription System)

### Visão Geral

O sistema de assinaturas permite pagamentos recorrentes com cartão de crédito via Asaas:
- **MONTHLY** - Mensal (renovação a cada 30 dias)
- **QUARTERLY** - Trimestral (renovação a cada 3 meses) com 10% desconto
- **YEARLY** - Anual (renovação a cada 12 meses) com 17% desconto

### Arquitetura de Assinaturas

```
┌─────────────────┐
│ subscriptionRoutes │ → Define endpoints HTTP
├─────────────────┤
│ subscriptionController │ → Valida entrada, orquestra
├─────────────────┤
│ subscriptionService │ → Lógica de negócio + integração Asaas
├─────────────────┤
│ Asaas API v3 │ → POST /v3/subscriptions
└─────────────────┘
```

### Tabelas Relacionadas

**subscriptions**
- `id` - UUID único da assinatura
- `user_id` - FK para users
- `plan_id` - FK para plans
- `asaas_subscription_id` - ID no Asaas (sub_xxxxxxx)
- `cycle` - MONTHLY | QUARTERLY | YEARLY
- `value` - Valor cobrado por ciclo
- `status` - ACTIVE | EXPIRED | CANCELLED | SUSPENDED
- `next_due_date` - Próxima data de cobrança
- `card_brand` - VISA, MASTERCARD, etc (apenas últimos 4 dígitos)
- `card_last4` - Últimos 4 dígitos do cartão

**users (campos adicionais)**
- `subscription_id` - FK para subscriptions (assinatura ativa)
- `subscription_cycle` - Cache do ciclo atual
- `subscription_status` - active | inactive | expired | cancelled

### Ciclo de Vida de uma Assinatura

```
1. Usuário escolhe plano + ciclo (QUARTERLY ou YEARLY)
2. Frontend envia dados do cartão (tokenizado)
3. subscriptionService.createSubscription()
   ├─ Valida plano
   ├─ Calcula valor com desconto
   ├─ Cria/obtém customer no Asaas
   ├─ POST /v3/subscriptions no Asaas
   ├─ Salva subscription no banco local
   └─ Ativa plano do usuário
4. Asaas processa pagamento
5. Webhook: PAYMENT_CONFIRMED
   └─ Assinatura fica ACTIVE
6. Renovação Automática (após ciclo):
   ├─ Asaas cobra cartão automaticamente
   └─ Webhook: SUBSCRIPTION_PAYMENT_RECEIVED
7. Cancelamento (opcional):
   ├─ subscriptionService.cancelSubscription()
   ├─ DELETE /v3/subscriptions/{id} no Asaas
   └─ Mantém acesso até próxima renovação
```

### Descontos por Ciclo

```javascript
// Implementação em subscriptionService.js
DISCOUNTS: {
  MONTHLY: 0,        // 0% desconto (R$ 49,90/mês → R$ 49,90)
  QUARTERLY: 0.10,   // 10% desconto (R$ 49,90/mês → R$ 134,90/trimestre = R$ 44,97/mês)
  YEARLY: 0.17       // 17% desconto (R$ 49,90/mês → R$ 499,90/ano = R$ 41,66/mês)
}
```

### Endpoints de Assinatura

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/subscriptions` | Criar assinatura | ✅ |
| GET | `/api/subscriptions/active` | Buscar assinatura ativa | ✅ |
| GET | `/api/subscriptions` | Listar histórico | ✅ |
| DELETE | `/api/subscriptions/:id` | Cancelar assinatura | ✅ |
| PUT | `/api/subscriptions/:id/card` | Atualizar cartão | ✅ |
| GET | `/api/subscriptions/pricing` | Obter preços calculados | ❌ |

### Eventos de Webhook (Asaas)

```javascript
// Eventos tratados em subscriptionService.handleSubscriptionWebhook()
SUBSCRIPTION_PAYMENT_RECEIVED → Renovação confirmada (atualiza next_due_date)
SUBSCRIPTION_EXPIRED → Assinatura expirou (reverte para plano Free)
SUBSCRIPTION_CANCELLED → Assinatura cancelada (mantém acesso até vencimento)
```

### Exemplo de Criação de Assinatura

```javascript
POST /api/subscriptions
Authorization: Bearer {jwt_token}

{
  "planId": "uuid-do-plano-pro",
  "cycle": "YEARLY",
  "creditCardData": {
    "holderName": "João Silva",
    "number": "5162306219378829",
    "expiryMonth": "12",
    "expiryYear": "2028",
    "cvv": "318"
  }
}

// Response 201 Created
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_abc123",
      "status": "ACTIVE",
      "cycle": "YEARLY",
      "cycleLabel": "Anual",
      "value": 499.90,
      "nextDueDate": "2027-02-11",
      "creditCard": {
        "brand": "MASTERCARD",
        "last4": "8829"
      },
      "savings": {
        "amount": 98.90,
        "percentage": 17,
        "message": "Economize R$ 98,90 (17%)"
      }
    },
    "plan": {
      "id": "uuid",
      "name": "Pro",
      "monthlyPrice": 49.90
    }
  },
  "message": "Assinatura Anual criada com sucesso!"
}
```

### Regras de Negócio - Assinaturas

1. **Unicidade**: Usuário pode ter apenas 1 assinatura ativa por vez
2. **Validação de Cartão**: Cartão deve ser validado antes de enviar ao Asaas
3. **PCI Compliance**: NUNCA armazenar número completo do cartão ou CVV
4. **Cancelamento**: Mantém acesso até próxima renovação (não reembolsa)
5. **Renovação Automática**: Asaas cobra automaticamente no `next_due_date`
6. **Falha de Pagamento**: Status muda para SUSPENDED, Asaas tenta novamente
7. **Expiração**: Após 3 tentativas falhas, status → EXPIRED, plano → Free
8. **Atualização de Cartão**: Não cancela assinatura, apenas substitui dados de pagamento

### Segurança - Assinaturas

```javascript
// ✅ CORRETO - Armazenar apenas metadados
{
  card_brand: "VISA",
  card_last4: "1234"
}

// ❌ NUNCA FAZER - Expor dados sensíveis
{
  card_number: "4111111111111111", // ❌ NUNCA!
  cvv: "123" // ❌ NUNCA!
}
```

### Webhooks - Fluxo Completo

```javascript
// paymentController.handleWebhook()
POST /api/webhooks/asaas

// 1. Validar assinatura do webhook
if (!validateSignature(req.body, req.headers['asaas-access-token'])) {
  return 401;
}

// 2. Determinar tipo de evento
const { event, payment, subscription } = req.body;

// 3. Rotear para handler correto
if (event.includes('SUBSCRIPTION') || subscription) {
  // Webhook de assinatura
  subscriptionService.handleSubscriptionWebhook(event, subscription);
} else if (payment) {
  // Webhook de pagamento único
  paymentService.processWebhook(event, payment);
}

// 4. Retornar 200 imediatamente (Asaas espera resposta rápida)
return 200;
```

### Migrations Relacionadas

- `006_create_subscriptions.sql` - Tabela subscriptions + RLS + triggers
- `007_add_subscription_fields_to_users.sql` - Campos de cache em users + sincronização automática

---

## �🔐 Segurança

### Princípios de Segurança

1. **Nunca expor service role key do Supabase** - Usar apenas no backend
2. **Sempre validar userId** - Garantir que usuário só acesse seus próprios dados
3. **Usar RLS do Supabase** - Row Level Security para camada adicional de proteção
4. **Hash de senhas** - Sempre usar bcrypt antes de salvar no banco
5. **Validar JWT em todas as rotas protegidas** - Usar middleware `authenticateToken`
6. **Rate limiting** - Proteger contra abuso de API
7. **CORS configurado** - Apenas origens permitidas
8. **Helmet.js** - Headers de segurança HTTP
9. **Sanitização de entrada** - Validar e limpar dados recebidos
10. **Logs sem dados sensíveis** - Nunca logar senhas, tokens completos

### Checklist de Segurança para Novos Endpoints

- [ ] Middleware `authenticateToken` aplicado?
- [ ] Validação de `userId` no service?
- [ ] Query com `.eq('user_id', userId)` para isolar dados?
- [ ] Rate limiting configurado?
- [ ] Validação de entrada implementada?
- [ ] Logs não contêm dados sensíveis?
- [ ] Tratamento de erros sem expor detalhes internos?

---

## 📦 Dependências do Projeto

### Dependências de Produção

- `@supabase/supabase-js` - Cliente Supabase
- `express` - Framework web
- `jsonwebtoken` - JWT para autenticação
- `bcryptjs` - Hash de senhas
- `axios` - Cliente HTTP
- `cors` - CORS middleware
- `helmet` - Segurança HTTP
- `morgan` - Logging HTTP
- `dotenv` - Variáveis de ambiente
- `celebrate` - Validação de requisições
- `express-rate-limit` - Rate limiting
- `multer` - Upload de arquivos
- `exceljs` - Geração de Excel
- `pdfkit` - Geração de PDF
- `date-fns` - Manipulação de datas

### Dependências de Desenvolvimento

- `jest` - Framework de testes
- `supertest` - Testes de API HTTP
- `nodemon` - Hot reload em desenvolvimento
- `cross-env` - Variáveis de ambiente cross-platform

---

## 🚀 Scripts Disponíveis

```json
{
  "start": "node src/server.js",        // Produção
  "dev": "nodemon src/server.js",       // Desenvolvimento
  "test": "jest --runInBand"            // Testes
}
```

---

## 🎯 Instruções Gerais para o GitHub Copilot

### Ao Criar Código Novo

1. **Sempre seguir a arquitetura MVC com Services**
2. **Usar ES6+ modules (import/export)**
3. **Código em inglês, comentários e mensagens em português**
4. **Seguir padrões de nomenclatura da tabela**
5. **Incluir tratamento de erros com try/catch**
6. **Validar dados de entrada**
7. **Usar `sendSuccess` e `sendError` para respostas**
8. **Incluir logs para debug**
9. **Documentar com comentários**
10. **Isolar dados por userId**

### Ao Modificar Código Existente

1. **Manter consistência com código ao redor**
2. **Não quebrar padrões estabelecidos**
3. **Atualizar testes se necessário**
4. **Manter compatibilidade com APIs existentes**
5. **Adicionar logs se necessário**

### Ao Criar Testes

1. **Sempre criar testes junto com código novo**
2. **Cobrir cenário de sucesso**
3. **Cobrir cenários de erro**
4. **Usar `beforeAll` para setup**
5. **Usar `afterAll` para cleanup**
6. **Limpar dados de teste após execução**
7. **Usar nomes descritivos para testes**

### Ao Trabalhar com Supabase

1. **Usar `supabaseAdmin` nos services**
2. **Sempre incluir `.eq('user_id', userId)` para isolar dados**
3. **Usar `.select()` específico, nunca `*`**
4. **Usar `.maybeSingle()` quando esperar 0 ou 1 resultado**
5. **Usar `.single()` quando esperar exatamente 1 resultado**
6. **Verificar `error` após cada query**
7. **Lançar exceções em caso de erro**

### Ao Implementar Rate Limiting

1. **Usar `express-rate-limit` para endpoints públicos**
2. **Configurar limites apropriados**
3. **Mensagem clara quando limite atingido**
4. **Considerar diferentes limites para diferentes endpoints**

### Ao Implementar Autenticação

1. **Sempre usar `authenticateToken` em rotas protegidas**
2. **Usar `isAdmin` para rotas administrativas**
3. **Validar token JWT**
4. **Popular `req.user` e `req.userId`**
5. **Retornar 401 para token ausente**
6. **Retornar 403 para token inválido**

---

## 📊 Estrutura de Commits

Seguir padrão de commits semântico em **português**, tempo **presente**, modo **imperativo**:

### Formato

```
tipo(escopo): descrição curta

[corpo opcional com mais detalhes]

[rodapé opcional com breaking changes ou issues]
```

### Tipos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Apenas documentação
- `style`: Formatação, ponto e vírgula, etc (sem mudança de código)
- `refactor`: Refatoração sem adicionar feature ou corrigir bug
- `test`: Adicionar ou corrigir testes
- `chore`: Atualização de tarefas de build, configs, etc

### Exemplos

```
feat(categoria): adiciona validação de limite do plano

Implementa verificação de limite antes de criar categoria customizada.
Retorna erro 403 com dados do limite quando atingido.

feat(auth): implementa middleware de autenticação JWT

fix(pagamento): corrige cálculo de data de vencimento

docs(readme): atualiza instruções de instalação

refactor(transacao): simplifica lógica de cálculo de saldo

test(categoria): adiciona testes de validação de limite

chore(deps): atualiza dependências do projeto
```

---

## 🔄 Criação Automática de Testes

### Regras para Criação Automática

Quando criar um novo **Controller**, **Service** ou **Route**, SEMPRE criar arquivo de teste correspondente automaticamente.

### Padrão de Nomenclatura de Testes

- Controller: `categoryController.js` → `categoryController.test.js`
- Service: `categoriesService.js` → `categoriesService.test.js`
- Route: `categoryRoutes.js` → `categoryRoutes.test.js`

### Estrutura Mínima de Teste

Todo teste deve conter:

1. **Setup** - `beforeAll` para criar dados de teste
2. **Cleanup** - `afterAll` para limpar dados de teste
3. **Cenário de sucesso** - Teste do fluxo feliz
4. **Cenários de erro** - Testes de validações e erros esperados
5. **Verificações completas** - Verificar status, success, data, message

### Template Mínimo de Teste

```javascript
describe('NomeDoComponente', () => {
  // Setup
  beforeAll(async () => {
    // Criar dados de teste
  });

  // Cleanup
  afterAll(async () => {
    // Limpar dados de teste
  });

  describe('metodo1', () => {
    test('deve executar com sucesso', async () => {
      // Arrange
      const input = { /* dados */ };

      // Act
      const result = await componente.metodo1(input);

      // Assert
      expect(result).toBeDefined();
    });

    test('deve retornar erro quando validação falhar', async () => {
      // Arrange
      const input = { /* dados inválidos */ };

      // Act & Assert
      await expect(
        componente.metodo1(input)
      ).rejects.toThrow('mensagem de erro');
    });
  });
});
```

---

## ✅ Checklist de Boas Práticas

### Ao Criar Novo Endpoint

- [ ] Route criada em `src/routes/`
- [ ] Controller criado em `src/controllers/`
- [ ] Service criado em `src/services/`
- [ ] Middleware de autenticação aplicado
- [ ] Validação de entrada implementada
- [ ] Isolamento de dados por userId
- [ ] Respostas padronizadas com `sendSuccess/sendError`
- [ ] Tratamento de erros com try/catch
- [ ] Logs de debug incluídos
- [ ] Testes criados
- [ ] Documentação atualizada (se necessário)

### Ao Criar Nova Feature

- [ ] Branch criada a partir da main
- [ ] Código segue padrões do projeto
- [ ] Testes unitários implementados
- [ ] Testes de integração implementados (se aplicável)
- [ ] Todos os testes passando
- [ ] Sem warnings ou erros no console
- [ ] Código revisado
- [ ] Commit semântico seguindo padrão
- [ ] Merge request criado

---

## 🎓 Exemplos de Uso Completo

### Exemplo 1: Criar Novo Recurso "Tags"

#### 1. Criar Migration SQL (`migrations/004_create_tags_table.sql`)

```sql
-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#607D8B',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### 2. Criar Service (`src/services/tagService.js`)

```javascript
import { supabaseAdmin } from '../config/supabase.js';
import { planLimitsService } from './planLimitsService.js';

export const tagService = {
  async list(userId) {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .select('id, name, color, created_at, updated_at')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('[tagService.list] erro ao buscar tags:', error);
      throw error;
    }

    return data || [];
  },

  async create(userId, payload) {
    const { name, color } = payload;

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      throw new Error('Nome da tag é obrigatório');
    }

    // Verifica limite do plano
    const limitCheck = await planLimitsService.canCreateTag(userId);
    if (!limitCheck.allowed) {
      const error = new Error(
        `Limite de tags atingido. Você tem ${limitCheck.current} de ${limitCheck.limit} tags no plano ${limitCheck.planName}. Faça upgrade!`
      );
      error.status = 403;
      error.data = {
        current: limitCheck.current,
        limit: limitCheck.limit,
        planName: limitCheck.planName,
        upgradeRequired: true
      };
      throw error;
    }

    // Verifica duplicidade
    const { data: existing } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', trimmedName)
      .maybeSingle();

    if (existing) {
      throw new Error('Tag com este nome já existe');
    }

    const { data, error } = await supabaseAdmin
      .from('tags')
      .insert([{
        user_id: userId,
        name: trimmedName,
        color: color || '#607D8B'
      }])
      .select('id, name, color, created_at, updated_at')
      .single();

    if (error) {
      console.error('[tagService.create] erro ao criar tag:', error);
      throw error;
    }

    return data;
  },

  async update(userId, tagId, payload) {
    const updateData = {};

    if (payload.name) updateData.name = payload.name.trim();
    if (payload.color) updateData.color = payload.color;

    if (Object.keys(updateData).length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('tags')
      .update(updateData)
      .eq('id', tagId)
      .eq('user_id', userId)
      .select('id, name, color, created_at, updated_at')
      .single();

    if (error) {
      console.error('[tagService.update] erro ao atualizar tag:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Tag não encontrada');
    }

    return data;
  },

  async remove(userId, tagId) {
    const { error } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);

    if (error) {
      console.error('[tagService.remove] erro ao remover tag:', error);
      throw error;
    }

    return true;
  }
};
```

#### 3. Criar Controller (`src/controllers/tagController.js`)

```javascript
import { tagService } from '../services/tagService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const tagController = {
  async list(req, res) {
    try {
      const userId = req.user.id;
      const tags = await tagService.list(userId);
      return sendSuccess(res, tags, 'Tags listadas com sucesso');
    } catch (error) {
      console.error('[tagController.list] erro:', error);
      return sendError(res, error.message || 'Erro ao listar tags', error.status || 400);
    }
  },

  async create(req, res) {
    try {
      const userId = req.user.id;
      const { name, color } = req.body;

      if (!name) {
        return sendError(res, 'Nome da tag é obrigatório', 400);
      }

      const tag = await tagService.create(userId, { name, color });
      return sendSuccess(res, tag, 'Tag criada com sucesso', 201);
    } catch (error) {
      console.error('[tagController.create] erro:', error);
      const statusCode = error.status || 400;
      return sendError(res, error.message || 'Erro ao criar tag', statusCode, error.data);
    }
  },

  async update(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, color } = req.body;

      if (!id) {
        return sendError(res, 'ID da tag é obrigatório', 400);
      }

      const tag = await tagService.update(userId, id, { name, color });
      return sendSuccess(res, tag, 'Tag atualizada com sucesso');
    } catch (error) {
      console.error('[tagController.update] erro:', error);
      return sendError(res, error.message || 'Erro ao atualizar tag', error.status || 400);
    }
  },

  async remove(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        return sendError(res, 'ID da tag é obrigatório', 400);
      }

      await tagService.remove(userId, id);
      return sendSuccess(res, null, 'Tag removida com sucesso');
    } catch (error) {
      console.error('[tagController.remove] erro:', error);
      return sendError(res, error.message || 'Erro ao remover tag', error.status || 400);
    }
  }
};
```

#### 4. Criar Route (`src/routes/tagRoutes.js`)

```javascript
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkTagLimit } from '../middleware/planLimits.js';
import { tagController } from '../controllers/tagController.js';

const router = express.Router();

router.get('/', authenticateToken, tagController.list);
router.post('/', authenticateToken, checkTagLimit, tagController.create);
router.put('/:id', authenticateToken, tagController.update);
router.delete('/:id', authenticateToken, tagController.remove);

export default router;
```

#### 5. Registrar Route em `src/app.js`

```javascript
import tagRoutes from './routes/tagRoutes.js';

// ...

app.use('/api/tags', tagRoutes);
```

#### 6. Criar Teste (`src/services/tagService.test.js`)

```javascript
import { tagService } from '../services/tagService.js';
import { supabaseAdmin } from '../config/supabase.js';

describe('TagService', () => {
  let userId;
  let tagId;

  beforeAll(async () => {
    const { data: user } = await supabaseAdmin
      .from('users')
      .insert([{
        email: 'tagtest@example.com',
        password: 'hash',
        name: 'Tag Test User'
      }])
      .select()
      .single();

    userId = user.id;
  });

  afterAll(async () => {
    await supabaseAdmin.from('tags').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
  });

  test('deve criar tag com sucesso', async () => {
    const tag = await tagService.create(userId, {
      name: 'Importante',
      color: '#FF0000'
    });

    expect(tag).toHaveProperty('id');
    expect(tag.name).toBe('Importante');
    expect(tag.color).toBe('#FF0000');

    tagId = tag.id;
  });

  test('deve lançar erro quando nome vazio', async () => {
    await expect(
      tagService.create(userId, { name: '' })
    ).rejects.toThrow('obrigatório');
  });

  test('deve listar tags do usuário', async () => {
    const tags = await tagService.list(userId);

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  test('deve atualizar tag', async () => {
    const updated = await tagService.update(userId, tagId, {
      name: 'Muito Importante',
      color: '#FF5555'
    });

    expect(updated.name).toBe('Muito Importante');
    expect(updated.color).toBe('#FF5555');
  });

  test('deve remover tag', async () => {
    const result = await tagService.remove(userId, tagId);
    expect(result).toBe(true);
  });
});
```

---

## 🏁 Conclusão

Este documento serve como guia completo para o GitHub Copilot entender a arquitetura, padrões e convenções do projeto **Financial Control API**.

### Principais Pontos

✅ Arquitetura MVC com Services  
✅ ES6+ Modules  
✅ Código em inglês, comentários em português  
✅ Respostas padronizadas  
✅ Autenticação JWT  
✅ Isolamento de dados por userId  
✅ Rate limiting  
✅ Testes automatizados  
✅ Segurança em primeiro lugar  

### Lembre-se

- Sempre seguir os templates fornecidos
- Sempre criar testes junto com código novo
- Sempre validar entrada e isolar dados por usuário
- Sempre usar respostas padronizadas
- Sempre incluir logs para debug
- Sempre tratar erros apropriadamente

---

**Última atualização:** Fevereiro de 2026  
**Versão:** 1.0.0  
**Projeto:** Financial Control API
