import {pgTable, uuid, varchar, timestamp} from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar('name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
})