const repository = require('../repositories/pedidos.repository');
const AppError = require('../errors/AppError');
const {
  TIPOS,
  PRIORIDADES,
  STATUS,
  STATUS_INICIAL,
  TRANSICOES,
} = require('../constants/pedido');

const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const normalizar = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

function validarNovoPedido(dados) {
  if (!ehObjeto(dados)) {
    throw new AppError('Dados inválidos', 400, ['O corpo da requisição deve ser um objeto JSON.']);
  }

  const erros = [];

  if (typeof dados.cliente !== 'string' || dados.cliente.trim() === '') {
    erros.push('cliente é obrigatório e deve ser um texto não vazio.');
  }

  if (typeof dados.valor !== 'number' || !Number.isFinite(dados.valor) || dados.valor <= 0) {
    erros.push('valor deve ser um número maior que zero.');
  }

  if (!TIPOS.includes(normalizar(dados.tipo))) {
    erros.push(`tipo inválido. Valores aceitos: ${TIPOS.join(', ')}.`);
  }

  if (!PRIORIDADES.includes(normalizar(dados.prioridade))) {
    erros.push(`prioridade inválida. Valores aceitos: ${PRIORIDADES.join(', ')}.`);
  }

  if (erros.length > 0) {
    throw new AppError('Dados inválidos', 400, erros);
  }
}

function criar(dados) {
  validarNovoPedido(dados);

  return repository.criar({
    cliente: dados.cliente.trim(),
    tipo: normalizar(dados.tipo),
    valor: dados.valor,
    prioridade: normalizar(dados.prioridade),
    status: STATUS_INICIAL,
  });
}

function listar() {
  return repository.listar();
}

// Converte o :id da URL em número. Qualquer coisa que não seja um inteiro
// não negativo não pode existir no sistema, logo resulta em 404.
function converterId(idTexto) {
  return /^\d+$/.test(String(idTexto)) ? Number(idTexto) : null;
}

function buscarPorId(idTexto) {
  const id = converterId(idTexto);
  const pedido = id === null ? null : repository.buscarPorId(id);
  if (!pedido) {
    throw new AppError('Pedido não encontrado.', 404);
  }
  return pedido;
}

function atualizarStatus(idTexto, dados) {
  // A existência do pedido é verificada primeiro: ID inexistente => 404.
  const pedido = buscarPorId(idTexto);

  if (!ehObjeto(dados) || typeof dados.status !== 'string') {
    throw new AppError('Dados inválidos', 400, ['status é obrigatório e deve ser um texto.']);
  }

  const novoStatus = normalizar(dados.status);

  if (!STATUS.includes(novoStatus)) {
    throw new AppError('Dados inválidos', 400, [
      `status inválido. Valores aceitos: ${STATUS.join(', ')}.`,
    ]);
  }

  if (!TRANSICOES[pedido.status].includes(novoStatus)) {
    const permitidos = TRANSICOES[pedido.status];
    const dica = permitidos.length
      ? `Transições permitidas a partir de "${pedido.status}": ${permitidos.join(', ')}.`
      : `"${pedido.status}" é um status final e não pode ser alterado.`;
    throw new AppError('Dados inválidos', 400, [
      `Transição não permitida: ${pedido.status} -> ${novoStatus}. ${dica}`,
    ]);
  }

  return repository.atualizar(pedido.id, { status: novoStatus });
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };
