import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { env } from '../schemas/env.schema.js'
import * as schema from './schema.js'

export const databasePool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
})

export const database = drizzle(databasePool, { schema })

export async function closeDatabaseConnection(): Promise<void> {
  await databasePool.end()
}
