// Erro "esperado" da aplicação (validação, não encontrado...).
// Qualquer outro erro é tratado como falha inesperada (HTTP 500).
class AppError extends Error {
  constructor(message, statusCode = 400, detalhes = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.detalhes = detalhes;
  }
}

module.exports = AppError;
