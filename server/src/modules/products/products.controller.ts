import type {Response} from 'express'

import { AuthenticateRequest } from "../../middleware/authenticateAccessToken";
import { getAllProducts } from './products.service';

export async function getAllProductsController(req: AuthenticateRequest, res: Response){
    const userId = req.user?.userId ?? null

    try{
        const page = Math.max(Number.parseInt(String(req.query.page), 10) || 1, 1)
        const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit), 10) || 10, 1), 50)
        const offset = (page - 1) * limit

        const allProductsResult = await getAllProducts(limit, offset)

        if(allProductsResult.length === 0){
            return res.status(404).json({message: 'No products found'})
        }

        return res.status(200).json({products: allProductsResult})
    }catch (error) {
        console.log(error)

        return res.status(500).json({error: 'Failed to fetch all products'})
    }
}