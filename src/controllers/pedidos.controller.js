const service = require('../services/pedidos.service');

// Controllers só traduzem HTTP <-> service. Nenhuma regra de negócio aqui.
function criar(req, res, next) {
  try {
    const pedido = service.criar(req.body);
    res.status(201).json(pedido);
  } catch (err) {
    next(err);
  }
}

function listar(req, res, next) {
  try {
    res.status(200).json(service.listar());
  } catch (err) {
    next(err);
  }
}

function buscarPorId(req, res, next) {
  try {
    res.status(200).json(service.buscarPorId(req.params.id));
  } catch (err) {
    next(err);
  }
}

function atualizarStatus(req, res, next) {
  try {
    res.status(200).json(service.atualizarStatus(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };
