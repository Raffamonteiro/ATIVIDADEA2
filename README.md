# API de Gerenciamento de Pedidos

Projeto prático avaliativo – Tópicos Avançados em Sistemas de Informação II.

API REST em **Node.js + Express** (JavaScript) para gerenciar pedidos de uma pequena loja, com
arquitetura em camadas, validação de dados, tratamento de erros e testes automatizados com **Jest**.
Os dados ficam **em memória** (somem ao reiniciar o servidor).

- **Aluno:** Raffael Monteiro Braz
- **RGM:** 45937176

## Como instalar e executar

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm start          # sobe a API em http://localhost:3000
npm test           # executa os testes automatizados (Jest)
```

A porta pode ser alterada com a variável `PORT` (ex.: `PORT=4000 npm start`).

## Estrutura do projeto

```
src/
├── server.js                   # sobe o servidor (listen)
├── app.js                      # configura o Express, rotas e middlewares
├── routes/pedidos.routes.js    # mapeia método + URL -> controller
├── controllers/                # traduz HTTP <-> service (sem regra de negócio)
├── services/                   # regras de negócio e validações
├── repositories/               # armazenamento em memória
├── middlewares/errorHandler.js # tratamento centralizado de erros
├── errors/AppError.js          # erro esperado (400, 404...)
└── constants/pedido.js         # tipos, prioridades, status e transições
tests/                          # testes de service e testes HTTP da API
postman/                        # coleção do Postman para importar
evidencias/                     # capturas de tela (Postman)
```

## Arquitetura e padrão implementado

Arquitetura **em camadas**, onde cada camada só conversa com a imediatamente abaixo:

| Camada | Responsabilidade | Não faz |
|---|---|---|
| **Routes** | Associar rota/método HTTP a um controller | Lógica alguma |
| **Controller** | Ler `req`, chamar o service, devolver `res` com o código HTTP | Validar ou aplicar regras |
| **Service** | Validar dados, aplicar regras (ex.: transições de status), lançar `AppError` | Conhecer Express (`req`/`res`) |
| **Repository** | Guardar e buscar pedidos em memória | Regras de negócio |
| **Middleware de erro** | Converter erros em respostas JSON com o status correto | — |

Decisões técnicas:

- **Service sem dependência de HTTP:** pode ser testado diretamente, sem subir servidor.
- **Repository isolado:** trocar a memória por um banco exigiria mexer apenas nele.
- **`AppError` para erros esperados:** o middleware distingue erros do usuário (400/404) de falhas
  inesperadas (500). Em falhas inesperadas, o cliente recebe uma mensagem genérica e o detalhe fica
  apenas no log do servidor.
- **`app.js` separado de `server.js`:** permite testar a API com Supertest sem abrir uma porta.
- **Repository devolve cópias** dos objetos, impedindo que código externo altere os dados guardados
  sem passar pelo repository.

## Valores aceitos

| Campo | Regra |
|---|---|
| `cliente` | Texto obrigatório; não pode ser vazio nem só espaços (espaços nas pontas são removidos) |
| `valor` | **Número** (tipo JSON `number`) maior que zero. `"350"` (texto) é rejeitado |
| `tipo` | `entrega`, `retirada` ou `local` |
| `prioridade` | `baixa`, `normal` ou `alta` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue`, `cancelado` |

`tipo`, `prioridade` e `status` ignoram maiúsculas/minúsculas e espaços nas pontas
(`" Entrega "` é gravado como `"entrega"`). Todo pedido novo nasce com status `recebido`.

### Transições de status permitidas

| De | Para |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | _(final, nenhuma)_ |
| `cancelado` | _(final, nenhuma)_ |

Não é possível pular etapas, voltar a um status anterior, nem cancelar um pedido já enviado.
Transição não permitida resulta em **400** com explicação.

## Rotas

| Método | Rota | Sucesso | Erros |
|---|---|---|---|
| POST | `/pedidos` | 201 | 400 |
| GET | `/pedidos` | 200 | — |
| GET | `/pedidos/:id` | 200 | 404 |
| PATCH | `/pedidos/:id/status` | 200 | 400, 404 |

### POST /pedidos

Requisição:
```json
{ "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal" }
```
Resposta `201`:
```json
{ "id": 1, "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
```
Resposta `400` (exemplo com `{"cliente": "  ", "valor": -5}`):
```json
{
  "erro": "Dados inválidos",
  "detalhes": [
    "cliente é obrigatório e deve ser um texto não vazio.",
    "valor deve ser um número maior que zero.",
    "tipo inválido. Valores aceitos: entrega, retirada, local.",
    "prioridade inválida. Valores aceitos: baixa, normal, alta."
  ]
}
```

### GET /pedidos
Resposta `200`: array de pedidos (`[]` se não houver nenhum).

### GET /pedidos/:id
- `200` com o pedido.
- `404` com `{ "erro": "Pedido não encontrado." }` se não existir. Um id que não seja um número
  inteiro (ex.: `abc`) também não existe e resulta em 404.

### PATCH /pedidos/:id/status
Requisição: `{ "status": "em_preparacao" }`

- `200` com o pedido atualizado.
- `400` se `status` estiver ausente, for desconhecido ou a transição não for permitida.
- `404` se o id não existir. **A existência do pedido é verificada antes do corpo**, então id
  inexistente com corpo inválido retorna 404.

## Tratamento de erros

| Situação | Resposta |
|---|---|
| Dados inválidos / JSON malformado | `400` + `{ "erro", "detalhes" }` |
| Pedido ou rota inexistente | `404` + `{ "erro" }` |
| Falha inesperada no servidor | `500` + `{ "erro": "Erro interno do servidor." }` |

Erros inesperados **nunca** são apresentados como erro de validação e não expõem detalhes internos.

## Testes

```bash
npm test
```

- `tests/pedidos.service.test.js`: regras de negócio (validações, ids, transições de status).
- `tests/pedidos.api.test.js`: comportamento HTTP completo com Supertest (códigos de status, corpo
  das respostas, JSON malformado, rota inexistente e erro 500 simulado).

Testes manuais: importe `postman/Pedidos.postman_collection.json` no Postman (a variável `baseUrl`
já aponta para `http://localhost:3000`).

## Evidências

A pasta `evidencias/` contém as capturas do Postman (método, URL, corpo, resposta e código HTTP):

| Arquivo | Cenário |
|---|---|
| `01-criacao.png` | POST válido → 201 |
| `02-validacao.png` | POST inválido → 400 |
| `03-listagem.png` | GET /pedidos → 200 |
| `04-consulta-inexistente.png` | GET de id inexistente → 404 |
| `05-atualizacao.png` | PATCH de status válido → 200 |

## Uso de IA

> **ATENÇÃO, aluno(a): esta seção precisa refletir o que realmente aconteceu. Edite antes de
> entregar.** O texto abaixo é um rascunho baseado no que o assistente de IA fez na geração do
> projeto.

**Utilizei IA?** Sim, o Claude (Anthropic) foi usado como apoio para gerar a estrutura inicial do
projeto, os testes e o rascunho deste README.

**Tarefas em que a IA ajudou:** estrutura de pastas em camadas, implementação inicial de routes,
controllers, services e repository, testes com Jest/Supertest e documentação.

**Sugestões e decisões (preencha com as suas próprias, com justificativa):**

- **Aceita:** separar `app.js` de `server.js`. Aceitei porque permite testar a API com Supertest sem
  ocupar uma porta real.
- **Aceita:** classe `AppError` + middleware de erro central. Aceitei porque separa claramente erro
  de validação (400/404) de falha inesperada (500), como pede o enunciado.
- **Decisão sobre `valor`:** a IA propôs rejeitar `valor` em formato texto (`"350"`). Mantive a
  regra porque o enunciado pede valor "numérico" e isso evita ambiguidade; ela está documentada
  acima. _(Se você discordar, altere em `pedidos.service.js` e nos testes.)_
- **_(Adicione aqui ao menos uma sugestão que você modificou ou rejeitou, e por quê.)_**

**Verificação:** executei `npm test` e testei manualmente os endpoints no Postman. _(Confirme que
você de fato fez isso.)_
