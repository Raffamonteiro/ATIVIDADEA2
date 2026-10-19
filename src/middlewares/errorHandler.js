const AppError = require('../errors/AppError');

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Erro esperado (validação / não encontrado)
  if (err instanceof AppError) {
    const corpo = { erro: err.message };
    if (err.detalhes) corpo.detalhes = err.detalhes;
    return res.status(err.statusCode).json(corpo);
  }

  // JSON malformado enviado pelo cliente
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: ['O corpo da requisição não é um JSON válido.'],
    });
  }

  // Falha inesperada: registra no servidor, resposta genérica ao cliente.
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, errorHandler };
