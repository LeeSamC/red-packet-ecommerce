import { pgTable, uuid, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "./products";
import { carts } from "./carts";

export const cartItems = pgTable('cart_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, {onDelete: 'restrict'}),
    cartId: uuid('cart_id').notNull().references(() => carts.id, {onDelete: 'cascade'}),
    quantity: integer('quantity').notNull()
},
(table) => [
    uniqueIndex('cart_id_product_id').on(
        table.cartId,
        table.productId
    )
]
)