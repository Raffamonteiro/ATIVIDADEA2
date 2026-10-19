// Camada de persistência em memória. Os dados somem ao reiniciar o servidor.
// Trocar por um banco de dados exigiria alterar apenas este arquivo.
let pedidos = [];
let proximoId = 1;

const copiar = (pedido) => (pedido ? { ...pedido } : null);

function criar(dados) {
  const pedido = { id: proximoId++, ...dados };
  pedidos.push(pedido);
  return copiar(pedido);
}

function listar() {
  return pedidos.map(copiar);
}

function buscarPorId(id) {
  return copiar(pedidos.find((p) => p.id === id));
}

function atualizar(id, campos) {
  const pedido = pedidos.find((p) => p.id === id);
  if (!pedido) return null;
  Object.assign(pedido, campos);
  return copiar(pedido);
}

// Usado nos testes para isolar os cenários.
function limpar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = { criar, listar, buscarPorId, atualizar, limpar };
