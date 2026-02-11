# Como Definir Valores por URL

O sistema de pagamento foi simplificado e agora aceita o valor diretamente pela URL.

## Formato da URL

Adicione o parâmetro `valor` na URL:

```
https://seusite.com/?valor=29.90
```

## Exemplos de Uso

### Valor de R$ 29,90
```
https://pagamento.cacaushow.fun/?valor=29.90
```

### Valor de R$ 129,90
```
https://pagamento.cacaushow.fun/?valor=129.90
```

### Valor de R$ 1.000,00
```
https://pagamento.cacaushow.fun/?valor=1000.00
```

### Usando vírgula (também funciona)
```
https://pagamento.cacaushow.fun/?valor=29,90
```

## Comportamento

### Com valor definido:
- O valor é exibido no formulário
- Botão "PIX" é habilitado
- Ao clicar, gera o QR Code e código PIX
- Não é obrigatório preencher nenhum campo do formulário

### Sem valor definido:
- Exibe mensagem pedindo para adicionar o valor na URL
- Botão "PIX" fica desabilitado
- Campos do formulário ainda podem ser preenchidos (opcional)

## Campos Opcionais

Todos os campos do formulário são agora **opcionais**:

- ✅ Nome
- ✅ CPF
- ✅ Celular
- ✅ CEP
- ✅ Endereço
- ✅ Número
- ✅ Complemento
- ✅ Cidade

**Removidos:**
- ❌ Bairro
- ❌ Estado
- ❌ Botão "Buscar" CEP

## Fluxo Simplificado

1. **Usuário acessa a URL com o valor**
   ```
   https://seusite.com/?valor=29.90
   ```

2. **Vê o valor e pode (opcionalmente) preencher dados**

3. **Clica no botão "PIX"**

4. **Sistema gera o QR Code automaticamente**

5. **Usuário escaneia ou copia o código PIX**

## Configuração da API Mistic

Para gerar QR Codes reais, configure as credenciais no arquivo `.env`:

```env
MISTIC_CLIENT_ID=seu_client_id
MISTIC_CLIENT_SECRET=seu_client_secret
```

**Sem credenciais:**
- O sistema retorna um erro amigável
- O pedido não é criado
- Usuário é informado que a API não está configurada

## Teste Rápido

1. Acesse: `http://localhost:3000/?valor=29.90`
2. Veja o valor exibido
3. Clique em "PIX"
4. O QR Code será gerado (se a API Mistic estiver configurada)

## Observações Importantes

- O valor é obrigatório para gerar o pagamento
- Formatos aceitos: `29.90` ou `29,90`
- Valores negativos ou zero são rejeitados
- Todos os campos do formulário são 100% opcionais
- O sistema funciona mesmo se nenhum dado do cliente for informado
