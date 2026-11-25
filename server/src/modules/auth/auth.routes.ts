import {Router} from 'express'
import { loginController } from './auth.controller'
import { rateLimiter } from '../../middleware/rateLimiter'

const router = Router()

router.post('/login', rateLimiter, loginController)

export default router