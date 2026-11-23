import {pgTable, uuid, timestamp} from 'drizzle-orm/pg-core'
import { users } from './users'

export const carts = pgTable('carts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'cascade'}),
    createdAt: timestamp('created_at').notNull().defaultNow()
})