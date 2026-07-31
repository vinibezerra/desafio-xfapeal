import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { app } from '../src/app.js'

describe('GET /api/health', () => {
  it('informa que a API está disponível', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      status: 'ok',
    })
    expect(response.body.timestamp).toEqual(expect.any(String))
    expect(response.body.uptimeSeconds).toEqual(expect.any(Number))
  })
})

describe('rota inexistente', () => {
  it('responde com erro 404 padronizado', async () => {
    const response = await request(app).get('/api/inexistente')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: {
        message: 'Rota não encontrada: GET /api/inexistente',
      },
    })
  })
})
