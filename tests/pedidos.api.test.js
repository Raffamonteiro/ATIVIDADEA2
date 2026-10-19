const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/repositories/pedidos.repository');
const service = require('../src/services/pedidos.service');

const valido = { cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal' };

beforeEach(() => repository.limpar());

describe('POST /pedidos', () => {
  test('201 com pedido criado', async () => {
    const res = await request(app).post('/pedidos').send(valido);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...valido, status: 'recebido' });
  });

  test('400 com mensagem JSON explicativa para dados inválidos', async () => {
    const res = await request(app).post('/pedidos').send({ cliente: '  ', valor: -5 });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Dados inválidos');
    expect(Array.isArray(res.body.detalhes)).toBe(true);
    expect(res.body.detalhes.length).toBeGreaterThan(0);
  });

  test('400 quando não há corpo', async () => {
    const res = await request(app).post('/pedidos');
    expect(res.status).toBe(400);
  });

  test('400 para JSON malformado (não é 500)', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente": ');
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });
});

describe('GET /pedidos', () => {
  test('200 com lista vazia', async () => {
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('200 com pedidos cadastrados', async () => {
    service.criar(valido);
    service.criar({ ...valido, cliente: 'Ana' });
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /pedidos/:id', () => {
  test('200 para pedido existente', async () => {
    const criado = service.criar(valido);
    const res = await request(app).get(`/pedidos/${criado.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(criado);
  });

  test('404 para id inexistente', async () => {
    const res = await request(app).get('/pedidos/999');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  test('404 para id não numérico', async () => {
    const res = await request(app).get('/pedidos/abc');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /pedidos/:id/status', () => {
  test('200 para atualização válida', async () => {
    const criado = service.criar(valido);
    const res = await request(app)
      .patch(`/pedidos/${criado.id}/status`)
      .send({ status: 'em_preparacao' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');
  });

  test('400 para status inválido', async () => {
    const criado = service.criar(valido);
    const res = await request(app)
      .patch(`/pedidos/${criado.id}/status`)
      .send({ status: 'xyz' });
    expect(res.status).toBe(400);
  });

  test('400 para transição não permitida', async () => {
    const criado = service.criar(valido);
    const res = await request(app)
      .patch(`/pedidos/${criado.id}/status`)
      .send({ status: 'entregue' });
    expect(res.status).toBe(400);
    expect(res.body.detalhes[0]).toMatch(/Transição não permitida/);
  });

  test('400 sem corpo', async () => {
    const criado = service.criar(valido);
    const res = await request(app).patch(`/pedidos/${criado.id}/status`);
    expect(res.status).toBe(400);
  });

  test('404 para id inexistente', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'cancelado' });
    expect(res.status).toBe(404);
  });
});

describe('Tratamento de erros gerais', () => {
  test('404 para rota desconhecida', async () => {
    const res = await request(app).get('/qualquer-coisa');
    expect(res.status).toBe(404);
  });

  test('erro inesperado vira 500 e não vaza detalhes internos', async () => {
    const spyErro = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyRepo = jest.spyOn(repository, 'listar').mockImplementation(() => {
      throw new Error('falha interna secreta');
    });

    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ erro: 'Erro interno do servidor.' });
    expect(JSON.stringify(res.body)).not.toMatch(/secreta/);

    spyRepo.mockRestore();
    spyErro.mockRestore();
  });
});
