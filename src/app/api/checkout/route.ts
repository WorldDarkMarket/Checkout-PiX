import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface CheckoutRequest {
  nome?: string
  cpf?: string
  celular?: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  cidade?: string
  valor: number
}

interface MisticResponse {
  message: string
  data: {
    transactionId: string
    payer: {
      name: string
      document: string
    }
    transactionFee: number
    transactionType: string
    transactionMethod: string
    transactionAmount: number
    transactionState: string
    qrCodeBase64: string
    qrcodeUrl: string
    copyPaste: string
  }
}

async function createMisticTransaction(
  amount: number,
  payerName: string,
  payerDocument: string,
  orderId: string
): Promise<MisticResponse> {
  const clientId = process.env.MISTIC_CLIENT_ID
  const clientSecret = process.env.MISTIC_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais da API Mistic não configuradas')
  }

  const response = await fetch('https://api.misticpay.com/api/transactions/create', {
    method: 'POST',
    headers: {
      'ci': clientId,
      'cs': clientSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount,
      payerName: payerName || 'Cliente',
      payerDocument: payerDocument || '00000000000',
      transactionId: orderId,
      description: `Pagamento R$ ${amount.toFixed(2)} - #${orderId}`,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Erro na API Mistic:', errorData)
    throw new Error(`Erro ao criar transação PIX: ${response.status}`)
  }

  const data: MisticResponse = await response.json()
  return data
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()

    if (!body.valor || body.valor <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido' },
        { status: 400 }
      )
    }

    console.log('Valor recebido para pagamento:', body.valor)

    const cpfLimpo = body.cpf ? body.cpf.replace(/\D/g, '') : null
    const cepLimpo = body.cep ? body.cep.replace(/\D/g, '') : null
    const celularLimpo = body.celular ? body.celular.replace(/\D/g, '') : null

    const order = await db.order.create({
      data: {
        nome: body.nome || null,
        cpf: cpfLimpo,
        celular: celularLimpo,
        cep: cepLimpo,
        endereco: body.endereco || null,
        numero: body.numero || null,
        complemento: body.complemento || null,
        cidade: body.cidade || null,
        valor: body.valor,
        status: 'pending',
        paymentMethod: 'pix',
      },
    })

    try {
      console.log('Enviando transação para Mistic com valor:', body.valor)
      const misticData = await createMisticTransaction(
        body.valor,
        body.nome || 'Cliente',
        cpfLimpo || '00000000000',
        order.id
      )
      console.log('Transação Mistic criada com sucesso. ID:', misticData.data.transactionId)

      await db.order.update({
        where: { id: order.id },
        data: {
          pixCode: misticData.data.copyPaste,
          pixQrCodeUrl: misticData.data.qrcodeUrl,
          status: misticData.data.transactionState === 'PENDENTE' ? 'pending' : 'paid',
        },
      })

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

      return NextResponse.json({
        success: true,
        orderId: order.id,
        misticTransactionId: misticData.data.transactionId,
        pix: {
          qrCode: misticData.data.qrcodeUrl,
          qrCodeBase64: misticData.data.qrCodeBase64,
          pixCode: misticData.data.copyPaste,
          valor: body.valor,
          expiresAt: expiresAt,
        },
      })

    } catch (misticError) {
      await db.order.delete({
        where: { id: order.id }
      })

      console.error('Erro ao processar transação Mistic:', misticError)

      if (misticError instanceof Error && misticError.message.includes('Credenciais')) {
        return NextResponse.json(
          {
            error: 'API Mistic não configurada',
            message: 'Configure as credenciais MISTIC_CLIENT_ID e MISTIC_CLIENT_SECRET no arquivo .env'
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: 'Erro ao criar transação PIX',
          message: misticError instanceof Error ? misticError.message : 'Erro desconhecido'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro ao processar checkout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'OrderId é obrigatório' },
        { status: 400 }
      )
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        valor: order.valor,
        createdAt: order.createdAt,
      },
    })

  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
