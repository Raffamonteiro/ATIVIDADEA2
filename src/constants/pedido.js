const TIPOS = ['entrega', 'retirada', 'local'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];
const STATUS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
const STATUS_INICIAL = 'recebido';

// Máquina de estados: para cada status, quais são os próximos permitidos.
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};

module.exports = { TIPOS, PRIORIDADES, STATUS, STATUS_INICIAL, TRANSICOES };
