import { describe, expect, it } from 'vitest'

import { AppError } from '../src/errors/app-error.js'
import { parseEducationCsv } from '../src/services/education-csv.service.js'

const header =
  'co_mun,no_mun,ano,fonte,variavel,ensino_rede,ensino_tipo,valor'

describe('parseEducationCsv', () => {
  it('converte as colunas do CSV para o modelo da aplicação', () => {
    const csv = [
      header,
      '2700300,Arapiraca,2023,censo_escolar,Escolas,Estadual,Ensino Médio,42',
    ].join('\n')

    expect(parseEducationCsv(Buffer.from(csv))).toEqual({
      rows: [
        {
          municipalityCode: '2700300',
          municipalityName: 'Arapiraca',
          year: 2023,
          source: 'censo_escolar',
          variable: 'Escolas',
          educationNetwork: 'Estadual',
          educationType: 'Ensino Médio',
          value: '42',
        },
      ],
      readRows: 1,
      rejectedRows: 0,
      errors: [],
    })
  })

  it('respeita vírgulas dentro de campos entre aspas', () => {
    const csv = [
      header,
      '2700300,"Arapiraca, AL",2023,censo_escolar,Escolas,Estadual,Ensino Médio,42',
    ].join('\n')

    expect(parseEducationCsv(Buffer.from(csv)).rows[0]?.municipalityName).toBe(
      'Arapiraca, AL',
    )
  })

  it('devolve 400 para cabeçalho diferente do formato esperado', () => {
    const csv = 'municipio,ano\nArapiraca,2023'

    try {
      parseEducationCsv(Buffer.from(csv))
      throw new Error('Era esperado um erro de validação')
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).statusCode).toBe(400)
    }
  })

  it('devolve 400 quando o CSV possui somente o cabeçalho', () => {
    expect(() => parseEducationCsv(Buffer.from(header))).toThrowError(
      'O CSV não contém registros para importar.',
    )
  })

  it('devolve 400 quando o conteúdo não está em UTF-8', () => {
    expect(() => parseEducationCsv(Buffer.from([0xff]))).toThrowError(
      'O CSV não está codificado em UTF-8.',
    )
  })

  it('rejeita somente a linha inválida e mantém as linhas válidas', () => {
    const csv = [
      header,
      '2700300,Arapiraca,2023,censo_escolar,Escolas,Estadual,Ensino Médio,42',
      '123,Arapiraca,2023,censo_escolar,Escolas,Estadual,Ensino Médio,abc',
    ].join('\n')

    const result = parseEducationCsv(Buffer.from(csv))

    expect(result.readRows).toBe(2)
    expect(result.rows).toHaveLength(1)
    expect(result.rejectedRows).toBe(1)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ line: 3, column: 'co_mun' }),
        expect.objectContaining({ line: 3, column: 'valor' }),
      ]),
    )
  })

  it('preserva zero e não cria linhas para combinações ausentes', () => {
    const csv = [
      header,
      '2704302,Maceió,2023,censo_escolar,Escolas,Federal,Ensino Fundamental,0',
    ].join('\n')

    const result = parseEducationCsv(Buffer.from(csv))

    expect(result.readRows).toBe(1)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]?.value).toBe('0')
  })

  it('rejeita ano fora do intervalo 2007 a 2025', () => {
    const csv = [
      header,
      '2700300,Arapiraca,2006,censo_escolar,Escolas,Estadual,Ensino Médio,42',
    ].join('\n')

    const result = parseEducationCsv(Buffer.from(csv))

    expect(result.rows).toHaveLength(0)
    expect(result.rejectedRows).toBe(1)
    expect(result.errors[0]).toMatchObject({ line: 2, column: 'ano' })
  })

  it('rejeita percentual fora da faixa de 0 a 100', () => {
    const csv = [
      header,
      '2700300,Arapiraca,2023,indicadores_rendimento,Taxa de Aprovação,Total,Ensino Fundamental,100.1',
    ].join('\n')

    const result = parseEducationCsv(Buffer.from(csv))

    expect(result.rows).toHaveLength(0)
    expect(result.rejectedRows).toBe(1)
    expect(result.errors[0]).toMatchObject({ line: 2, column: 'valor' })
  })

  it('rejeita contagem absoluta fracionária', () => {
    const csv = [
      header,
      '2700300,Arapiraca,2023,censo_escolar,Escolas,Estadual,Ensino Médio,42.5',
    ].join('\n')

    const result = parseEducationCsv(Buffer.from(csv))

    expect(result.rows).toHaveLength(0)
    expect(result.rejectedRows).toBe(1)
    expect(result.errors[0]).toMatchObject({ line: 2, column: 'valor' })
  })

  it('rejeita variável que não pertence à fonte informada', () => {
    const csv = [
      header,
      '2700300,Arapiraca,2023,censo_escolar,Taxa de Aprovação,Total,Ensino Fundamental,96.1',
    ].join('\n')

    const result = parseEducationCsv(Buffer.from(csv))

    expect(result.rows).toHaveLength(0)
    expect(result.rejectedRows).toBe(1)
    expect(result.errors[0]).toMatchObject({ line: 2, column: 'variavel' })
  })
})
