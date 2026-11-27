import {Router} from 'express'
import { optionalAuthenticateToken } from '../../middleware/optionalAuthenticateToken'
import { getAllProductsController } from './products.controller'

const router = Router()

router.get('/all', optionalAuthenticateToken, getAllProductsController)

export default router