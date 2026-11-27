import {pgTable,pgEnum, uuid, varchar, timestamp, integer, numeric} from 'drizzle-orm/pg-core'
import { users } from './users'
import { categories } from './categories'

export const productStatusEnum = pgEnum('product_status', [
    'in_stock',
    'out_of_stock',
])

export const products = pgTable('products', {
    id: uuid('product').defaultRandom().primaryKey(),
    name: varchar('name', {length: 50}).notNull(),
    categoryId: uuid('category_id').notNull().references(() => categories.id, {onDelete: 'set null'}),
    ownerId: uuid('ownerId').notNull().references(() => users.id, {onDelete: 'cascade'}),
    price: numeric('price', {precision: 10, scale: 2}).notNull(),
    units: integer('unit').notNull(),
    status: productStatusEnum('status').notNull().default('out_of_stock'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull()
})