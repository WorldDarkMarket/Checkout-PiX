'use client'

import { unstable_noStore as noStore } from 'next/cache'

noStore()

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Lock, CheckCircle2, Copy, Share2, MapPin, Phone, User, ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface FormData {
  nome: string
  cpf: string
  celular: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  cidade: string
}

interface PixData {
  qrCode: string
  qrCodeBase64?: string
  pixCode: string
  valor: number
  expiresAt: string
  orderId: string
}

export default function CheckoutPageContent() {
  const searchParams = useSearchParams()
  const valorParam = searchParams.get('valor')

  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [orderData, setOrderData] = useState<FormData | null>(null)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [valor, setValor] = useState<number>(0)
  const [checkingStatus, setCheckingStatus] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    cpf: '',
    celular: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    cidade: '',
  })

  useEffect(() => {
    if (valorParam) {
      const parsedValor = parseFloat(valorParam.replace(',', '.'))
      if (!isNaN(parsedValor) && parsedValor > 0) {
        setValor(parsedValor)
      }
    }
  }, [valorParam])

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (step === 'payment' && pixData) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/checkout?orderId=${pixData.orderId}`)
          const data = await response.json()
          
          if (data.success && data.order?.status === 'paid') {
            clearInterval(interval)
            setStep('success')
            toast({
              title: 'Pagamento confirmado!',
              description: 'Seu pagamento foi processado com sucesso.',
            })
            
            // Aguarda 3 segundos e tenta fechar a janela
            setTimeout(() => {
              handleReturnToStore()
            }, 3000)
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error)
        }
      }, 5000) // Verifica a cada 5 segundos

      return () => clearInterval(interval)
    }
  }, [step, pixData])

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value

    if (field === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (field === 'celular') {
      formattedValue = formatPhone(value)
    } else if (field === 'cep') {
      formattedValue = formatCEP(value)
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          valor,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao processar pedido')
      }

      const data = await response.json()
      setOrderData(formData)
      setPixData({
        ...data.pix,
        orderId: data.orderId,
      })
      setStep('payment')
      toast({
        title: 'Pagamento gerado!',
        description: 'Escaneie o QR Code ou copie o código PIX.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar pagamento',
        description: 'Tente novamente em alguns instantes.',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Código copiado!',
        description: 'Cole no seu app de banco para pagar.',
      })
    }
  }

  const sharePayment = async () => {
    if (pixData && orderData) {
      const shareText = `Olá! Pagamento de R$ ${valor.toFixed(2).replace('.', ',')} via PIX. Código: ${pixData.pixCode}`

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Pagamento PIX',
            text: shareText,
          })
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Erro ao compartilhar:', error)
          }
        }
      } else {
        navigator.clipboard.writeText(shareText)
        toast({
          title: 'Informações copiadas!',
          description: 'Você pode colar para compartilhar.',
        })
      }
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const handleReturnToStore = () => {
    if (typeof window !== 'undefined') {
      // Tenta fechar a janela
      if (window.opener) {
        window.close()
      } else {
        // Se não conseguir fechar, redireciona para a página anterior
        if (window.history.length > 1) {
          window.history.back()
        }
      }
    }
  }

  const checkPaymentStatus = async () => {
    if (!pixData) return
    
    setCheckingStatus(true)
    try {
      const response = await fetch(`/api/checkout?orderId=${pixData.orderId}`)
      const data = await response.json()
      
      if (data.success && data.order?.status === 'paid') {
        setStep('success')
        toast({
          title: 'Pagamento confirmado!',
          description: 'Seu pagamento foi processado com sucesso.',
        })
        
        setTimeout(() => {
          handleReturnToStore()
        }, 3000)
      } else {
        toast({
          variant: 'destructive',
          title: 'Pagamento pendente',
          description: 'Seu pagamento ainda não foi confirmado. Tente novamente em instantes.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao verificar status',
        description: 'Tente novamente em alguns instantes.',
      })
    } finally {
      setCheckingStatus(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h1>
            <p className="text-slate-600 mb-6">Seu pagamento foi processado com sucesso em ambiente seguro.</p>
            <div className="text-3xl font-bold text-green-600 mb-6">{formatCurrency(valor)}</div>
            <Button
              onClick={handleReturnToStore}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para a Loja
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-slate-500">
              Pagamento em ambiente seguro • Criptografia SSL
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (step === 'payment' && pixData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-4">
        {/* Header Mobile-First */}
        <div className="bg-white shadow-sm border-b py-3 px-4 mb-4 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <img
              src="/logo-cacaushow.jpg"
              alt="Logo Cacau Show"
              className="h-10 object-contain"
            />
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pagamento em ambiente seguro</span>
            </div>
          </div>
        </div>

        <div className="px-4 max-w-4xl mx-auto">
          {/* Success Message - Mobile Optimized */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
              <img
                src="/logo-pix.jpg"
                alt="PIX"
                className="h-8 md:h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
                      <rect width="200" height="60" fill="#32BCAD"/>
                      <text x="100" y="38" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">PIX</text>
                    </svg>
                  `)
                }}
              />
            </h1>
            <p className="text-sm md:text-base text-slate-600">Escaneie o QR Code ou copie o código</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* QR Code Card */}
            <Card className="order-2 md:order-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg md:text-xl">QR Code</CardTitle>
                <CardDescription className="text-sm">Use seu app de banco</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                {/* Valor - Mobile First */}
                <div className="text-center py-3 md:py-4 bg-green-50 rounded-lg">
                  <p className="text-xs md:text-sm text-slate-600 mb-1">Valor a pagar</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">{formatCurrency(pixData.valor)}</p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 md:p-4 rounded-xl border-2 border-slate-200 shadow-sm">
                    <img
                      src={pixData.qrCodeBase64 || pixData.qrCode}
                      alt="QR Code PIX"
                      className="w-40 h-40 md:w-48 md:h-48 object-contain"
                    />
                  </div>
                </div>

                {/* Código Copia e Cola */}
                <div className="space-y-2">
                  <Label htmlFor="pix-code" className="text-sm">Código Copia e Cola</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pix-code"
                      value={pixData.pixCode}
                      readOnly
                      className="font-mono text-[10px] md:text-xs bg-slate-50"
                    />
                    <Button
                      type="button"
                      variant={copied ? "default" : "outline"}
                      size="icon"
                      onClick={copyPixCode}
                      className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* PIX Button with Logo */}
                <Button
                  onClick={copyPixCode}
                  className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Copiando...
                    </>
                  ) : (
                    <>
                      <img
                        src="/logo-pix.jpg"
                        alt="PIX"
                        className="h-6 mr-2 object-contain brightness-0 invert"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
                              <text x="100" y="38" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">PIX</text>
                            </svg>
                          `)
                        }}
                      />
                      {copied ? 'Código Copiado!' : 'Copiar Código'}
                    </>
                  )}
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="flex items-center justify-center w-full gap-2 text-xs md:text-sm text-slate-600">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pagamento em ambiente seguro</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sharePayment}
                  className="text-slate-600 hover:text-slate-900 w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </CardFooter>
            </Card>

            {/* Info Card */}
            <Card className="order-1 md:order-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg md:text-xl">Informações</CardTitle>
                <CardDescription className="text-sm">Dados do pagamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Valor</span>
                    <span>{formatCurrency(valor)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(valor)}</span>
                  </div>
                </div>

                {orderData && (orderData.nome || orderData.celular || orderData.endereco) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      {orderData.nome && (
                        <>
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs md:text-sm text-slate-600">Nome</p>
                              <p className="font-medium text-sm md:text-base">{orderData.nome}</p>
                            </div>
                          </div>
                          <Separator />
                        </>
                      )}

                      {orderData.celular && (
                        <>
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs md:text-sm text-slate-600">Celular</p>
                              <p className="font-medium text-sm md:text-base">{orderData.celular}</p>
                            </div>
                          </div>
                          <Separator />
                        </>
                      )}

                      {orderData.endereco && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs md:text-sm text-slate-600">Endereço</p>
                            <p className="font-medium text-sm md:text-base">{orderData.endereco}{orderData.numero && `, ${orderData.numero}`}</p>
                            {orderData.complemento && <p className="text-xs md:text-sm text-slate-600">{orderData.complemento}</p>}
                            {orderData.cidade && <p className="text-xs md:text-sm text-slate-600">{orderData.cidade}</p>}
                            {orderData.cep && <p className="text-xs md:text-sm text-slate-600">CEP: {orderData.cep}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Check Status Button */}
                <Button
                  onClick={checkPaymentStatus}
                  variant="outline"
                  className="w-full"
                  disabled={checkingStatus}
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Verificar Pagamento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-slate-500">
            <p>O pagamento será processado após a confirmação.</p>
            <p className="mt-2 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              Pagamento em ambiente seguro • Criptografia SSL
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* Banner Mobile-First */}
        <div className="relative">
          <img
            src="/banner-campanha.jpg"
            alt="Banner Campanha Cacau Show"
            className="w-full h-40 md:h-64 object-cover rounded-b-3xl shadow-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 rounded-b-3xl" />
          <div className="absolute bottom-3 left-3 md:bottom-8 md:left-8">
            <img
              src="/logo-cacaushow.jpg"
              alt="Logo Cacau Show"
              className="h-12 md:h-24 object-contain bg-white rounded-xl p-2 shadow-lg"
            />
          </div>
        </div>

        <div className="px-3 md:px-4 py-6 md:py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2">
                <img
                  src="/logo-pix.jpg"
                  alt="PIX"
                  className="h-8 md:h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
                        <rect width="200" height="60" fill="#32BCAD"/>
                        <text x="100" y="38" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">PIX</text>
                      </svg>
                    `)
                  }}
                />
              </CardTitle>
              <CardDescription className="text-center text-sm md:text-base">
                {valor > 0 ? (
                  <>Valor: <span className="font-bold text-green-600 text-lg md:text-xl">{formatCurrency(valor)}</span></>
                ) : (
                  <>Preencha seus dados</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-sm md:text-base">Nome</Label>
                    <Input
                      id="nome"
                      placeholder="Seu nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="celular" className="text-sm md:text-base">Celular</Label>
                    <Input
                      id="celular"
                      placeholder="(00) 00000-0000"
                      value={formData.celular}
                      onChange={(e) => handleInputChange('celular', e.target.value)}
                      maxLength={15}
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-sm md:text-base">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      maxLength={14}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep" className="text-sm md:text-base">CEP</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => handleInputChange('cep', e.target.value)}
                      maxLength={9}
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco" className="text-sm md:text-base">Endereço</Label>
                    <Input
                      id="endereco"
                      placeholder="Rua, Avenida, etc."
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero" className="text-sm md:text-base">Número</Label>
                    <Input
                      id="numero"
                      placeholder="123"
                      value={formData.numero}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-sm md:text-base">Cidade</Label>
                    <Input
                      id="cidade"
                      placeholder="Sua cidade"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento" className="text-sm md:text-base">Complemento</Label>
                  <Input
                    id="complemento"
                    placeholder="Apto, Bloco, etc."
                    value={formData.complemento}
                    onChange={(e) => handleInputChange('complemento', e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>

                {valor > 0 && (
                  <div className="bg-slate-50 p-3 md:p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base text-slate-600">Valor a pagar</span>
                      <span className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(valor)}</span>
                    </div>
                  </div>
                )}

                {/* PIX Button with Logo */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg font-semibold"
                  size="lg"
                  disabled={loading || valor === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <img
                        src="/logo-pix.jpg"
                        alt="PIX"
                        className="h-6 mr-2 object-contain brightness-0 invert"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
                              <text x="100" y="38" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">PIX</text>
                            </svg>
                          `)
                        }}
                      />
                      Pagar com PIX
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-slate-600">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pagamento em ambiente seguro</span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
