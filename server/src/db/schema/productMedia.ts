import {pgTable, uuid, integer, text, primaryKey, unique} from 'drizzle-orm/pg-core'
import { products } from './products'
import { media } from './media'

export const productMedia = pgTable('product_media', {
    productId: uuid('product_id').notNull().references(() => products.id, {onDelete:'cascade'}),
    mediaId: uuid('media_id').notNull().references(() => media.id, {onDelete: 'cascade'}),
    position: integer('position').notNull().default(0),
    altText: text('alt_text')
},
(table) => [
    primaryKey({
        columns: [table.productId, table.mediaId]
    }),

    unique('unique_product_media_postion').on(
        table.productId,
        table.position
    )
]
)