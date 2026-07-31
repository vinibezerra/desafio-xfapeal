import { count } from 'drizzle-orm'

import { database } from '../database/client.js'
import {
  educationData,
  educationImports,
  type NewEducationData,
} from '../database/schema.js'
import { AppError } from '../errors/app-error.js'

export class EducationRepository {
  async insertMany(
    rows: NewEducationData[],
    importData: { fileHash: string; fileName: string },
  ): Promise<number> {
    const batchSize = 500

    await database.transaction(async (transaction) => {
      const [registeredImport] = await transaction
        .insert(educationImports)
        .values({
          ...importData,
          rowCount: rows.length,
        })
        .onConflictDoNothing({
          target: educationImports.fileHash,
        })
        .returning({ id: educationImports.id })

      if (!registeredImport) {
        throw new AppError(
          'Este conjunto de dados já foi importado anteriormente.',
          409,
        )
      }

      for (let index = 0; index < rows.length; index += batchSize) {
        const batch = rows.slice(index, index + batchSize)
        await transaction.insert(educationData).values(batch)
      }
    })

    return rows.length
  }

  async countRows(): Promise<number> {
    const [result] = await database
      .select({ total: count() })
      .from(educationData)

    return result?.total ?? 0
  }
}
