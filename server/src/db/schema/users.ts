import {pgTable, uuid, varchar, timestamp} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', {length: 50}).notNull(),
    lastName: varchar('last_name', {length: 50}).notNull(),
    username: varchar('username', {length: 50}).notNull().unique(),
    passwordHash: varchar('password_hash', {length: 256}).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
})