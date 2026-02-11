# Guia de Configuração do .env para Produção

## Arquivo `.env`

O arquivo `.env` está localizado na raiz do projeto: `/home/z/my-project/.env`

## Configuração Atual

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db

# Mistic API Credentials
# Substitua com suas credenciais reais da API Mistic
MISTIC_CLIENT_ID=seu_client_id
MISTIC_CLIENT_SECRET=seu_client_secret
```

---

## Como Obter Credenciais da API Mistic

### 1. Acesse a Plataforma Mistic
Visite: https://misticpay.com

### 2. Faça Login
Entre com suas credenciais de acesso.

### 3. Vá em Configurações ou API
Procure a seção onde você pode gerar credenciais de API.

### 4. Copie suas Credenciais
- **Client ID** → `MISTIC_CLIENT_ID`
- **Client Secret** → `MISTIC_CLIENT_SECRET`

### 5. Atualize o Arquivo `.env`

Edite o arquivo `.env` e substitua os valores:

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db

MISTIC_CLIENT_ID=seu_client_id_real_aqui
MISTIC_CLIENT_SECRET=seu_client_secret_real_aqui
```

**IMPORTANTE:** Não compartilhe seu Client Secret! Ele é como uma senha e deve ser mantido em segredo.

---

## Variáveis de Ambiente Explicadas

### `DATABASE_URL`
**Valor atual:** `file:/home/z/my-project/db/custom.db`

**O que é:** Caminho do banco de dados SQLite.

**Em produção:** Se você for usar PostgreSQL ou MySQL, mude para:
```env
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
```
ou
```env
DATABASE_URL=mysql://usuario:senha@host:porta/banco
```

### `MISTIC_CLIENT_ID`
**Valor atual:** `seu_client_id`

**O que é:** Identificador do cliente na API Mistic.

**Como obter:**
1. Faça login em https://misticpay.com
2. Vá em Configurações > API
3. Copie o Client ID

### `MISTIC_CLIENT_SECRET`
**Valor atual:** `seu_client_secret`

**O que é:** Chave secreta para autenticação na API Mistic.

**Como obter:**
1. Faça login em https://misticpay.com
2. Vá em Configurações > API
3. Copie o Client Secret
4. ⚠️ **NUNCA compartilhe este valor!**

---

## Configuração na Vercel

### Passo 1: Adicionar Variáveis de Ambiente

1. Acesse seu projeto na Vercel
2. Vá em **Settings** > **Environment Variables**
3. Clique em **Add New**
4. Adicione as variáveis:

| Nome | Valor | Ambiente |
|------|-------|-----------|
| `DATABASE_URL` | `file:/home/z/my-project/db/custom.db` | Production, Preview, Development |
| `MISTIC_CLIENT_ID` | `seu_client_id_real` | Production, Preview, Development |
| `MISTIC_CLIENT_SECRET` | `seu_client_secret_real` | Production, Preview, Development |

### Passo 2: Salvar e Deploy

1. Clique em **Save**
2. Faça um novo deploy do projeto

---

## Webhook URL para Mistic

Configure o webhook na plataforma Mistic apontando para:

```
https://checkout.cacaushow.fun/api/webhooks/confirmacaopix
```

Se o domínio for diferente, ajuste a URL acima.

---

## Verificação

Após configurar as credenciais, teste:

1. Acesse: `https://seu-dominio.com/?valor=29.90`
2. Preencha os dados
3. Clique em "Pagar com PIX"
4. O QR Code deve ser gerado com sucesso

Se houver erro de "API Mistic não configurada", verifique:
- As credenciais foram inseridas corretamente
- Não há espaços em branco
- O Client ID e Secret estão corretos

---

## Segurança

### ⚠️ IMPORTANTE

- **NUNCA** faze commit do arquivo `.env` com credenciais reais
- Adicione `.env` ao `.gitignore` (já deve estar incluído)
- Em produção, use variáveis de ambiente da plataforma de hospedagem
- O `MISTIC_CLIENT_SECRET` deve ser mantido em segredo absoluto

### .gitignore (Verifique se contém)

```
.env
.env.local
.env.production
*.db
```

---

## Teste Local com Credenciais

Para testar localmente com as credenciais reais:

1. Edite `.env` local
2. Substitua pelos valores reais
3. Reinicie o servidor (`bun run dev`)
4. Faça um teste de pagamento

---

## Erros Comuns

### "Credenciais inválidas" (Erro 401)

**Causa:** Client ID ou Client Secret incorretos.

**Solução:**
1. Verifique se copiou os valores corretos
2. Verifique se não há espaços extras
3. Confirme que as credenciais estão ativas na Mistic

### "API Mistic não configurada"

**Causa:** Variáveis de ambiente não definidas.

**Solução:**
1. Adicione `MISTIC_CLIENT_ID` e `MISTIC_CLIENT_SECRET` no `.env`
2. Reinicie o servidor
3. Tente novamente

### Build falha no Vercel

**Causa:** Alguma variável de ambiente obrigatória faltando.

**Solução:**
1. Verifique se todas as 3 variáveis estão configuradas na Vercel
2. Faça um novo deploy
3. Verifique os logs de build

---

## Resumo

Para o deploy funcionar:

1. ✅ Obtenha credenciais reais na Mistic
2. ✅ Configure `MISTIC_CLIENT_ID` e `MISTIC_CLIENT_SECRET` no `.env`
3. ✅ Configure as mesmas variáveis na Vercel
4. ✅ Configure o webhook na Mistic
5. ✅ Faça o deploy
6. ✅ Teste com uma transação real

O projeto está **100% pronto para deploy** na Vercel! 🚀
