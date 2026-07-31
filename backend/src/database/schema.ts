import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

export const educationData = pgTable(
  'dados_educacao',
  {
    id: serial('id').primaryKey(),
    municipalityCode: varchar('co_mun', { length: 7 }).notNull(),
    municipalityName: text('no_mun').notNull(),
    year: smallint('ano').notNull(),
    source: text('fonte').notNull(),
    variable: text('variavel').notNull(),
    educationNetwork: text('ensino_rede').notNull(),
    educationType: text('ensino_tipo').notNull(),
    value: numeric('valor', { precision: 16, scale: 4 }).notNull(),
  },
  (table) => [
    index('dados_agregacao_idx').on(
      table.year,
      table.variable,
      table.educationNetwork,
      table.educationType,
    ),
    index('dados_municipio_idx').on(table.municipalityCode),
  ],
)

export type EducationData = typeof educationData.$inferSelect
export type NewEducationData = typeof educationData.$inferInsert

export const educationImports = pgTable(
  'importacoes_educacao',
  {
    id: serial('id').primaryKey(),
    fileHash: varchar('arquivo_hash', { length: 64 }).notNull(),
    fileName: text('arquivo_nome').notNull(),
    rowCount: integer('quantidade_linhas').notNull(),
    importedAt: timestamp('importado_em', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('importacoes_educacao_arquivo_hash_uidx').on(table.fileHash),
  ],
)
