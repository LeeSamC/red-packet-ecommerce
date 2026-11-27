import {pgTable, uuid, varchar, integer, timestamp} from 'drizzle-orm/pg-core'
import { users } from './users'

export const media = pgTable('media', {
    id: uuid('id').defaultRandom().primaryKey(),
    uploadedBy: uuid('uploaded_by').notNull().references(() => users.id, {onDelete: 'set null'}),
    storageKey: varchar('storage_key', {length: 500}).notNull(),
    mimeType: varchar('mime_type', {length: 100}).notNull(),
    width: integer('width'),
    height: integer('height'),
    size: integer('size'),
    createdAt: timestamp('created_at').notNull().defaultNow()
})