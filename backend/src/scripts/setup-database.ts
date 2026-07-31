import 'dotenv/config'

import { Client } from 'pg'

import { env } from '../schemas/env.schema.js'

const targetUrl = new URL(env.DATABASE_URL)
const databaseName = decodeURIComponent(targetUrl.pathname.slice(1))

if (!databaseName) {
  throw new Error('A DATABASE_URL deve informar o nome do banco de dados.')
}

const maintenanceUrl = new URL(targetUrl)
maintenanceUrl.pathname = '/postgres'

const maintenanceClient = new Client({
  connectionString: maintenanceUrl.toString(),
})

await maintenanceClient.connect()

try {
  const existingDatabase = await maintenanceClient.query(
    'select 1 from pg_database where datname = $1',
    [databaseName],
  )

  if (existingDatabase.rowCount === 0) {
    const escapedDatabaseName = databaseName.replaceAll('"', '""')
    await maintenanceClient.query(`CREATE DATABASE "${escapedDatabaseName}"`)
    console.log(`Banco ${databaseName} criado.`)
  }
} finally {
  await maintenanceClient.end()
}

const targetClient = new Client({
  connectionString: targetUrl.toString(),
})

await targetClient.connect()

try {
  await targetClient.query(`
    CREATE TABLE IF NOT EXISTS dados_educacao (
      id SERIAL PRIMARY KEY,
      co_mun VARCHAR(7) NOT NULL,
      no_mun TEXT NOT NULL,
      ano SMALLINT NOT NULL,
      fonte TEXT NOT NULL,
      variavel TEXT NOT NULL,
      ensino_rede TEXT NOT NULL,
      ensino_tipo TEXT NOT NULL,
      valor NUMERIC(16, 4) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS dados_agregacao_idx
      ON dados_educacao (ano, variavel, ensino_rede, ensino_tipo);

    CREATE INDEX IF NOT EXISTS dados_municipio_idx
      ON dados_educacao (co_mun);

    CREATE TABLE IF NOT EXISTS importacoes_educacao (
      id SERIAL PRIMARY KEY,
      arquivo_hash VARCHAR(64) NOT NULL,
      arquivo_nome TEXT NOT NULL,
      quantidade_linhas INTEGER NOT NULL,
      importado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS importacoes_educacao_arquivo_hash_uidx
      ON importacoes_educacao (arquivo_hash);
  `)

  console.log('Tabelas e índices do banco verificados.')
} finally {
  await targetClient.end()
}
