import 'dotenv/config'

import { app } from './app.js'
import { closeDatabaseConnection } from './database/client.js'
import { env } from './schemas/env.schema.js'

const server = app.listen(env.PORT, () => {
  process.stdout.write(`API disponível em http://localhost:${env.PORT}\n`)
})

async function shutdown(signal: string) {
  process.stdout.write(`Encerrando a API após ${signal}...\n`)

  server.close(async (error) => {
    await closeDatabaseConnection()

    if (error) {
      process.stderr.write(`${error.message}\n`)
      process.exit(1)
    }

    process.exit(0)
  })
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
