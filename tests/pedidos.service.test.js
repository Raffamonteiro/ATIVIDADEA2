const service = require('../src/services/pedidos.service');
const repository = require('../src/repositories/pedidos.repository');
const AppError = require('../src/errors/AppError');

const valido = { cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal' };

beforeEach(() => repository.limpar());

describe('service.criar', () => {
  test('cria pedido válido com id e status inicial "recebido"', () => {
    const pedido = service.criar(valido);
    expect(pedido).toEqual({ id: 1, ...valido, status: 'recebido' });
  });

  test('gera ids sequenciais', () => {
    expect(service.criar(valido).id).toBe(1);
    expect(service.criar(valido).id).toBe(2);
  });

  test('remove espaços nas extremidades do cliente', () => {
    expect(service.criar({ ...valido, cliente: '  Ana  ' }).cliente).toBe('Ana');
  });

  test.each([
    ['cliente ausente', { cliente: undefined }],
    ['cliente vazio', { cliente: '' }],
    ['cliente só com espaços', { cliente: '   ' }],
    ['cliente não texto', { cliente: 123 }],
    ['valor zero', { valor: 0 }],
    ['valor negativo', { valor: -10 }],
    ['valor texto', { valor: 'abc' }],
    ['valor texto numérico', { valor: '350' }],
    ['valor NaN', { valor: NaN }],
    ['valor ausente', { valor: undefined }],
    ['tipo desconhecido', { tipo: 'voador' }],
    ['tipo ausente', { tipo: undefined }],
    ['prioridade desconhecida', { prioridade: 'urgentissima' }],
    ['prioridade ausente', { prioridade: undefined }],
  ])('rejeita com 400: %s', (_nome, alteracao) => {
    expect.assertions(2);
    try {
      service.criar({ ...valido, ...alteracao });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
    }
  });

  test('rejeita corpo que não é objeto', () => {
    expect(() => service.criar(undefined)).toThrow(AppError);
    expect(() => service.criar([])).toThrow(AppError);
  });

  test('acumula todos os erros em "detalhes"', () => {
    try {
      service.criar({});
    } catch (err) {
      expect(err.detalhes).toHaveLength(4);
    }
  });
});

describe('service.buscarPorId', () => {
  test('retorna o pedido existente', () => {
    const criado = service.criar(valido);
    expect(service.buscarPorId(String(criado.id))).toEqual(criado);
  });

  test.each(['999', 'abc', '-1', '1.5', ''])('id "%s" inexistente => 404', (id) => {
    expect.assertions(1);
    try {
      service.buscarPorId(id);
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });
});

describe('service.atualizarStatus', () => {
  test('transição válida recebido -> em_preparacao', () => {
    const { id } = service.criar(valido);
    expect(service.atualizarStatus(String(id), { status: 'em_preparacao' }).status).toBe(
      'em_preparacao'
    );
  });

  test('percorre o fluxo completo até entregue', () => {
    const { id } = service.criar(valido);
    service.atualizarStatus(String(id), { status: 'em_preparacao' });
    service.atualizarStatus(String(id), { status: 'enviado' });
    expect(service.atualizarStatus(String(id), { status: 'entregue' }).status).toBe('entregue');
  });

  test('não permite pular etapas (recebido -> entregue)', () => {
    const { id } = service.criar(valido);
    expect(() => service.atualizarStatus(String(id), { status: 'entregue' })).toThrow(AppError);
  });

  test('status finais não podem mudar', () => {
    const { id } = service.criar(valido);
    service.atualizarStatus(String(id), { status: 'cancelado' });
    expect(() => service.atualizarStatus(String(id), { status: 'recebido' })).toThrow(AppError);
  });

  test('não permite cancelar pedido já enviado', () => {
    const { id } = service.criar(valido);
    service.atualizarStatus(String(id), { status: 'em_preparacao' });
    service.atualizarStatus(String(id), { status: 'enviado' });
    expect(() => service.atualizarStatus(String(id), { status: 'cancelado' })).toThrow(AppError);
  });

  test('status desconhecido => 400', () => {
    const { id } = service.criar(valido);
    expect.assertions(1);
    try {
      service.atualizarStatus(String(id), { status: 'inexistente' });
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }
  });

  test('corpo sem status => 400', () => {
    const { id } = service.criar(valido);
    expect(() => service.atualizarStatus(String(id), {})).toThrow(AppError);
    expect(() => service.atualizarStatus(String(id), undefined)).toThrow(AppError);
  });

  test('id inexistente => 404', () => {
    expect.assertions(1);
    try {
      service.atualizarStatus('42', { status: 'cancelado' });
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });
});
