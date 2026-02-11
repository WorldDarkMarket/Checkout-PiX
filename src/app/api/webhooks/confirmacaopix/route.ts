import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface WebhookPayload {
  transactionId: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED'
  amount: number
  transactionFee?: number
  payer?: {
    name?: string
    document?: string
  }
  paidAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json()
    
    console.log('Webhook recebido:', {
      transactionId: body.transactionId,
      status: body.status,
      amount: body.amount,
    })

    // Validar dados obrigatórios
    if (!body.transactionId || !body.status) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Buscar pedido - busca por qualquer pedido (em produção, use um identificador único)
    const orders = await db.order.findMany({
      where: {
        status: 'pending'
      }
    })

    if (orders.length === 0) {
      console.log('Nenhum pedido pendente encontrado')
      return NextResponse.json({ success: true, message: 'Nenhum pedido pendente' })
    }

    // Atualizar o pedido mais recente pendente (em produção, use identificador adequado)
    const order = orders[0]
    
    let newStatus = 'pending'
    
    switch (body.status) {
      case 'PAID':
        newStatus = 'paid'
        break
      case 'FAILED':
      case 'CANCELED':
        newStatus = 'failed'
        break
      case 'PENDING':
      default:
        newStatus = 'pending'
        break
    }

    await db.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      }
    })

    console.log('Pedido atualizado:', {
      orderId: order.id,
      oldStatus: order.status,
      newStatus: newStatus,
    })

    return NextResponse.json({ 
      success: true,
      message: 'Status atualizado com sucesso',
      orderId: order.id,
      newStatus
    })

  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno', success: false },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook de confirmação PIX ativo',
    endpoint: '/api/webhooks/confirmacaopix',
    method: 'POST',
    expectedPayload: {
      transactionId: 'string',
      status: 'PENDING | PAID | FAILED | CANCELED',
      amount: 'number',
      transactionFee: 'number (opcional)',
      payer: {
        name: 'string (opcional)',
        document: 'string (opcional)'
      },
      paidAt: 'ISO datetime (opcional)'
    }
  })
}
