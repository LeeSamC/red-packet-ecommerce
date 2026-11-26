import {Router} from 'express'
import { loginController, logoutController, refreshController, registrationController } from './auth.controller'
import { rateLimiter } from '../../middleware/rateLimiter'
import { authenticateAccessToken } from '../../middleware/authenticateAccessToken'
import { authenticateRefreshToken } from '../../middleware/authenticateRefreshToken'

const router = Router()

router.post('/login', rateLimiter, loginController)

router.post('/register', rateLimiter, registrationController)

router.post('/logout', logoutController)

router.post('/refresh', authenticateRefreshToken, refreshController)

export default router