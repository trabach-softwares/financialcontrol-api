# Guia de Rate Limiting para Escala

## 📊 Situação Atual vs Recomendado

### ❌ Configuração Atual (Problemas)
```javascript
// PROBLEMA: Muito restritivo
windowMs: 15 * 60 * 1000  // 15 minutos
max: 100                   // 100 requisições

// RESULTADO: 100 req / 15min = 6.7 req/min = 400 req/hora
// Um usuário normal pode esgotar isso facilmente!
```

### ✅ Configuração Otimizada (Aplicada)
```javascript
// MELHOR: Janela menor, mais requisições
windowMs: 1 * 60 * 1000   // 1 minuto
max: 100                   // 100 requisições

// RESULTADO: 100 req/min = 6000 req/hora
// 15x mais permissivo, mas ainda protege contra abuse
```

---

## 🎯 Estratégias de Rate Limiting

### 1️⃣ Por IP (Atual - Básico)
**Quando usar:** Aplicações pequenas, poucos usuários

**Prós:**
- ✅ Simples de implementar
- ✅ Não requer autenticação

**Contras:**
- ❌ Múltiplos usuários no mesmo IP compartilham limite
- ❌ Um usuário mal-intencionado bloqueia todos
- ❌ Difícil escalar

```javascript
import { apiLimiter } from './middleware/rateLimiter.js';
router.use(apiLimiter);
```

---

### 2️⃣ Por User ID (Recomendado para Escala) ⭐
**Quando usar:** Aplicações em crescimento, muitos usuários

**Prós:**
- ✅ Cada usuário tem limite próprio
- ✅ Usuários não afetam uns aos outros
- ✅ Melhor para empresas (muitos users no mesmo IP)
- ✅ Escala bem

**Contras:**
- ❌ Requer autenticação
- ❌ Não protege rotas públicas

```javascript
import { userBasedLimiter } from './middleware/rateLimiterAdvanced.js';
router.use(authenticateToken, userBasedLimiter);
```

---

### 3️⃣ Por Plano (Monetização) 💰
**Quando usar:** Modelo freemium, diferentes tiers

**Prós:**
- ✅ Incentiva upgrade de plano
- ✅ Usuários premium têm melhor experiência
- ✅ Monetização clara

**Exemplo:**
- Gratuito: 60 req/min (3,600/hora)
- Pro: 120 req/min (7,200/hora)
- Premium: 300 req/min (18,000/hora)

```javascript
import { planBasedLimiter } from './middleware/rateLimiterAdvanced.js';
router.use(authenticateToken, planBasedLimiter);
```

---

### 4️⃣ Separar Read vs Write
**Quando usar:** Sempre! Proteção extra

**Lógica:**
- GET (leitura): Limite alto (100-200/min)
- POST/PUT/DELETE (escrita): Limite baixo (30/min)

```javascript
import { userBasedLimiter, writeLimiter } from './middleware/rateLimiterAdvanced.js';

// Leitura: mais permissivo
router.get('/transactions', authenticateToken, userBasedLimiter, getAll);

// Escrita: mais restritivo
router.post('/transactions', authenticateToken, writeLimiter, create);
router.put('/transactions/:id', authenticateToken, writeLimiter, update);
router.delete('/transactions/:id', authenticateToken, writeLimiter, delete);
```

---

## 🚀 Plano de Migração

### Fase 1: Imediato (Já Aplicado) ✅
- [x] Ajustar limites atuais (100 req/min)
- [x] Mudar janela de 15min → 1min
- [x] Desabilitar em desenvolvimento

### Fase 2: Curto Prazo (Próximos 1-2 meses)
- [ ] Implementar `userBasedLimiter` nas rotas principais
- [ ] Separar rate limit de READ vs WRITE
- [ ] Adicionar headers informativos (X-RateLimit-*)

### Fase 3: Médio Prazo (3-6 meses)
- [ ] Implementar `planBasedLimiter`
- [ ] Criar dashboard de monitoramento
- [ ] Alertas quando usuários atingem limites

### Fase 4: Longo Prazo (6+ meses)
- [ ] Rate limiting distribuído (Redis)
- [ ] Machine learning para detectar padrões de abuse
- [ ] API keys para integrações

---

## 📈 Cálculos de Capacidade

### Cenário 1: 100 Usuários Simultâneos
```
Limite atual: 100 req/min por IP
Se 100 usuários estão no mesmo IP: 100 req/min ÷ 100 = 1 req/min por usuário ❌

Limite recomendado: 100 req/min por USER
100 usuários × 100 req/min = 10,000 req/min total ✅
```

### Cenário 2: 1,000 Usuários Simultâneos
```
User-based: 1,000 × 100 req/min = 100,000 req/min
Plan-based:
  - 700 Gratuito × 60 = 42,000 req/min
  - 250 Pro × 120 = 30,000 req/min
  - 50 Premium × 300 = 15,000 req/min
  Total = 87,000 req/min ✅
```

---

## 🛠️ Como Implementar (Exemplo)

### Antes (Rate Limit por IP):
```javascript
// transactionRoutes.js
import { apiLimiter } from '../middleware/rateLimiter.js';

router.use(apiLimiter); // Todos compartilham limite
router.get('/', authenticateToken, getAll);
router.post('/', authenticateToken, create);
```

### Depois (Rate Limit por User):
```javascript
// transactionRoutes.js
import { userBasedLimiter, writeLimiter } from '../middleware/rateLimiterAdvanced.js';

// Rotas de leitura - limite alto
router.get('/', authenticateToken, userBasedLimiter, getAll);

// Rotas de escrita - limite baixo
router.post('/', authenticateToken, writeLimiter, create);
router.put('/:id', authenticateToken, writeLimiter, update);
router.delete('/:id', authenticateToken, writeLimiter, delete);
```

---

## 🔍 Monitoramento

### Headers Retornados
O rate limiter adiciona headers úteis:

```http
RateLimit-Limit: 100          # Limite total
RateLimit-Remaining: 87       # Requisições restantes
RateLimit-Reset: 1699999999   # Quando reseta (timestamp)
Retry-After: 60               # Segundos para tentar novamente
```

### No Frontend
```javascript
const response = await fetch('/api/transactions');

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Aguarde ${retryAfter} segundos`);
}
```

---

## ⚡ Performance e Redis

### Problema Atual
- Rate limit armazenado em **memória** do servidor
- Se reiniciar: limites resetam
- **Não funciona com múltiplos servidores** (load balancer)

### Solução: Redis
```bash
npm install rate-limit-redis redis
```

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

export const distributedLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:', // rate-limit prefix
  }),
});
```

**Quando implementar Redis:**
- Quando tiver múltiplos servidores
- Quando quiser persistir limites entre restarts
- Quando tiver 1000+ usuários simultâneos

---

## ✅ Checklist de Implementação

### Agora (Desenvolvimento)
- [x] Desabilitar rate limiting em dev
- [x] Ajustar limites de produção
- [x] Criar rate limiters avançados

### Próximo Deploy (Produção)
- [ ] Testar limites em staging
- [ ] Monitorar headers de rate limit
- [ ] Documentar para o frontend

### Futuro (Escala)
- [ ] Migrar para user-based limiter
- [ ] Implementar plan-based limiter
- [ ] Adicionar Redis
- [ ] Dashboard de monitoramento

---

## 🎯 Recomendação Final

**Para o seu caso (sistema com muitas requisições futuras):**

1. **Curto prazo:** Use a configuração atual ajustada (100 req/min por IP)
2. **Médio prazo:** Migre para `userBasedLimiter` (100 req/min por usuário)
3. **Longo prazo:** Implemente `planBasedLimiter` + Redis

**Ordem de prioridade:**
1. ✅ Ajustar limites atuais (FEITO)
2. 🔄 Migrar para user-based (PRÓXIMO)
3. 💰 Adicionar plan-based (MONETIZAÇÃO)
4. ⚡ Implementar Redis (ESCALA)

A configuração atual já está **muito melhor** e suporta crescimento inicial. Quando chegar em **1000+ usuários ativos**, implemente Redis.
