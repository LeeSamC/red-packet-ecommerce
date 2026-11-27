import {pgTable, uuid, integer, uniqueIndex, numeric} from 'drizzle-orm/pg-core'
import { orders } from './orders'
import { products } from './products'

export const orderItems = pgTable('order_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull().references(() => orders.id, {onDelete: 'cascade'}),
    productId: uuid('product_id').notNull().references(() => products.id, {onDelete: 'restrict'}),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', {precision: 10, scale: 2}).notNull()
},
(table) => [
    uniqueIndex('order_id_product_id').on(
        table.orderId,
        table.productId
    )
]
)