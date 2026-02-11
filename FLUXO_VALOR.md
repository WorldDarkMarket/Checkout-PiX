# Fluxo do Valor da URL para API Mistic

## Como o Valor é Passado do Link para a API Mistic

### 1. Frontend - Pega o valor da URL

```typescript
// src/app/page.tsx
const searchParams = useSearchParams()
const valorParam = searchParams.get('valor')

useEffect(() => {
  if (valorParam) {
    const parsedValor = parseFloat(valorParam.replace(',', '.'))
    if (!isNaN(parsedValor) && parsedValor > 0) {
      setValor(parsedValor)
    }
  }
}, [valorParam])
```

**URL Exemplo:** `/?valor=29.90`
**Resultado:** `valor = 29.9`

### 2. Frontend - Envia para a API

```typescript
// src/app/page.tsx - handleSubmit
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ...formData,
    valor,  // ← Valor da URL é enviado aqui
  }),
})
```

**Body enviado:**
```json
{
  "nome": "João",
  "cpf": "123.456.789-09",
  "valor": 29.9,  // ← Valor da URL
  "celular": "(11) 98765-4321",
  ...
}
```

### 3. Backend API - Recebe e Valida

```typescript
// src/app/api/checkout/route.ts
export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()

    // Validação do valor
    if (!body.valor || body.valor <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido' },
        { status: 400 }
      )
    }

    console.log('Valor recebido para pagamento:', body.valor)
    // → Log: "Valor recebido para pagamento: 29.9"
```

### 4. Backend API - Envia para a Mistic

```typescript
// src/app/api/checkout/route.ts
try {
  console.log('Enviando transação para Mistic com valor:', body.valor)
  // → Log: "Enviando transação para Mistic com valor: 29.9"

  const misticData = await createMisticTransaction(
    body.valor,  // ← Valor da URL é passado aqui
    body.nome || 'Cliente',
    cpfLimpo || '00000000000',
    order.id
  )

  console.log('Transação Mistic criada com sucesso. ID:', misticData.data.transactionId)
```

### 5. Função createMisticTransaction

```typescript
// src/app/api/checkout/route.ts
async function createMisticTransaction(
  amount: number,
  payerName: string,
  payerDocument: string,
  orderId: string
): Promise<MisticResponse> {
  const clientId = process.env.MISTIC_CLIENT_ID
  const clientSecret = process.env.MISTIC_CLIENT_SECRET

  const response = await fetch('https://api.misticpay.com/api/transactions/create', {
    method: 'POST',
    headers: {
      'ci': clientId,
      'cs': clientSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount,  // ← Valor da URL é enviado aqui como 'amount'
      payerName: payerName || 'Cliente',
      payerDocument: payerDocument || '00000000000',
      transactionId: orderId,
      description: `Pagamento R$ ${amount.toFixed(2)} - #${orderId}`,  // ← Valor também está na descrição
    }),
  })
```

**Request para Mistic:**
```json
{
  "amount": 29.9,
  "payerName": "João",
  "payerDocument": "12345678909",
  "transactionId": "clx123abc456",
  "description": "Pagamento R$ 29.90 - #clx123abc456"
}
```

## Resumo do Fluxo

```
URL: /?valor=29.90
  ↓
Frontend: useSearchParams().get('valor')
  ↓
Estado: valor = 29.9
  ↓
Form Submit: fetch('/api/checkout', { body: { valor: 29.9 } })
  ↓
Backend API: request.json() → body.valor = 29.9
  ↓
Validação: if (!body.valor || body.valor <= 0) → OK
  ↓
createMisticTransaction(29.9, ...)
  ↓
Mistic API: { amount: 29.9, ... }
  ↓
QR Code gerado com valor de R$ 29,90
```

## Logs de Debug

Quando um pagamento é gerado, você verá os seguintes logs no console:

```
Valor recebido para pagamento: 29.9
Enviando transação para Mistic com valor: 29.9
Transação Mistic criada com sucesso. ID: 31484480
```

## Exemplos de Uso

### URL com valor 29,90
```
https://pagamento.cacaushow.fun/?valor=29.90
```
- `amount` enviado para Mistic: `29.9`
- Descrição: `"Pagamento R$ 29.90 - #clx123abc456"`

### URL com valor 129,90
```
https://pagamento.cacaushow.fun/?valor=129.90
```
- `amount` enviado para Mistic: `129.9`
- Descrição: `"Pagamento R$ 129.90 - #clx456def789"`

### URL com valor 1000,00
```
https://pagamento.cacaushow.fun/?valor=1000.00
```
- `amount` enviado para Mistic: `1000.0`
- Descrição: `"Pagamento R$ 1000.00 - #clx789ghi012"`

## Formatos Aceitos

- `?valor=29.90` → `29.9` ✅
- `?valor=29,90` → `29.9` ✅
- `?valor=129.90` → `129.9` ✅
- `?valor=1000` → `1000` ✅

## Validações

1. **Frontend**: Converte vírgula em ponto, verifica se é número válido e maior que 0
2. **Backend API**: Valida se `body.valor` existe e é maior que 0
3. **Mistic API**: Valida o `amount` (deve ser número positivo)

O valor da URL é garantidamente o valor que será solicitado na API Mistic! ✅
