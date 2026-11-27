import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { categories, products, users, media, productMedia } from "../../db/schema";


export async function getAllProducts(limit: number, offset: number){

    const allProducts = await db.select({
        productId: products.id,
        name: products.name,
        price: products.price,
        units: products.units,
        status: products.status,
        createdAt: products.createdAt,

        categoryId: categories.id,
        categoryName: categories.name,

        ownerId: users.id,
        ownerName: users.username

    })
    .from(products)
    .leftJoin(
        categories,
        eq(products.categoryId, categories.id)
    )
    .innerJoin(
        users,
        eq(products.ownerId, users.id)
    )
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset)

    if(allProducts.length === 0) {
        return []
    }

    const productIds = allProducts.map(product => product.productId)

    const mediaRows = await db.select({
        productId: productMedia.productId,
        media: {
            id: media.id,
            storageKey: media.storageKey,
            mimeType: media.mimeType,
            width: media.width,
            height: media.height,
            position: productMedia.position,
            altText: productMedia.altText
        }
    })
    .from(productMedia)
    .innerJoin(
        media,
        eq(productMedia.mediaId, media.id)
    )
    .where(inArray(productMedia.productId, productIds))
    .orderBy(asc(productMedia.position))

    type ProductMediaItem = (typeof mediaRows)[number]['media']

    const mediaByProduct = new Map<string, ProductMediaItem[]>()

    for(const row of mediaRows){
        const items = mediaByProduct.get(row.productId)

        if(items){
            items.push(row.media)
        }else{
            mediaByProduct.set(row.productId, [row.media])
        }
    }

    return allProducts.map(product => ({
        ...product,
        media: mediaByProduct.get(product.productId) ?? []
    }))

} 