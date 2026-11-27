import { pgTable, pgEnum, uuid, timestamp, numeric} from "drizzle-orm/pg-core";
import { users } from "./users";

export const orderStatusEnum = pgEnum('order_status', [
    'pending',
    'paid'
])

export const orders = pgTable('orders', {
    id: uuid('order').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, {onDelete: 'no action'}),
    status: orderStatusEnum('status').notNull().default('pending'),
    totalAmount: numeric('total_amount', {precision: 10, scale: 2}).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})