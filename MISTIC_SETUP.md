# Configuração da API Mistic

Este projeto está integrado com a API Mistic para geração de QR Codes PIX.

## Configuração das Credenciais

Para usar a API Mistic em produção, você precisa configurar suas credenciais no arquivo `.env`:

```env
MISTIC_CLIENT_ID=seu_client_id_real
MISTIC_CLIENT_SECRET=seu_client_secret_real
```

## Como Obter as Credenciais

1. Acesse o painel da Mistic: https://misticpay.com
2. Faça login na sua conta
3. Vá em Configurações > API
4. Copie o `Client ID` e `Client Secret`

## Funcionalidades Implementadas

### ✅ Backend (API Route: `/api/checkout`)

- **Criação de Transação PIX**: Integração completa com a API Mistic
- **Validação de Dados**: Valida CPF, CEP e campos obrigatórios
- **Armazenamento**: Salva pedidos no banco de dados com Prisma
- **QR Code**: Retorna tanto URL quanto base64 do QR Code
- **Código Copia e Cola**: Retorna o código PIX BR Code

### ✅ Frontend (Página de Checkout)

- **Formulário Completo**:
  - Nome Completo
  - CPF (com formatação automática)
  - Celular (com formatação automática)
  - CEP (com busca automática via ViaCEP)
  - Endereço completo

- **Pagamento PIX**:
  - Logo PIX oficial
  - QR Code gerado pela Mistic
  - Código "Copia e Cola"
  - Botão para copiar código
  - Compartilhamento de pagamento
  - Indicadores de segurança

- **Design**:
  - Logo Cacau Show no header
  - Banner de campanha
  - Design responsivo (mobile-first)
  - Cores profissionais
  - Animações suaves
  - Feedback visual (toasts)

## Estrutura da Resposta da API

### POST `/api/checkout`

**Request:**
```json
{
  "nome": "João Silva",
  "cpf": "123.456.789-09",
  "celular": "(11) 98765-4321",
  "cep": "01310-100",
  "endereco": "Av. Paulista",
  "numero": "1000",
  "complemento": "Apto 123",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "estado": "SP",
  "valor": 129.90
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "clx123abc456",
  "misticTransactionId": "31484480",
  "pix": {
    "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...",
    "qrCodeBase64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "pixCode": "00020101021226820014br.gov.bcb.pix2560qrcode...",
    "valor": 129.90,
    "expiresAt": "2025-01-15T14:30:00.000Z"
  }
}
```

## Testes

Para testar a integração:

1. Configure as credenciais no `.env`
2. Inicie o servidor: `bun run dev`
3. Acesse: http://localhost:3000
4. Preencha o formulário e clique em "Ir para Pagamento"
5. Use o código PIX gerado para testar o pagamento

## Observações

- Se as credenciais não estiverem configuradas, a API retornará um erro informando que a Mistic não está configurada
- O QR Code em base64 é usado preferencialmente no frontend para evitar chamadas externas
- Os pedidos são salvos no banco de dados SQLite com status `pending` por padrão
- O status é atualizado automaticamente para `paid` quando a Mistic confirma o pagamento
