import type{Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'
import {z} from 'zod'
import {and, eq, gt} from 'drizzle-orm'

import {db} from '../db'
import { refreshTokens } from '../db/schema'
import type{ AuthenticateRequest, AuthUser } from './authenticateAccessToken'

const accessClaimSchema = z.object({
    userId: z.uuid(),
    sessionId: z.uuid()
})

export async function optionalAuthenticateToken(req: AuthenticateRequest, res: Response, next: NextFunction) {
    const token = req.cookies.accessToken

    if(typeof token !== 'string' || !token){
        return next()
    }

    const secret = process.env.ACCESS_TOKEN_SECRET

    if(!secret){
        return next(new Error('ACCESS_TOKEN_SECRET not configured'))
    }

    let claims: AuthUser

    try{
        const decoded = jwt.verify(token, secret, {algorithms: ['HS256']})

        const result = accessClaimSchema.safeParse(decoded)

        if(!result.success){
            return next()
        }

        claims = result.data
    }catch {
        return next()
    }

    try{
        const session = await db.query.refreshTokens.findFirst({where: and(
            eq(refreshTokens.id, claims.sessionId),
            eq(refreshTokens.userId, claims.userId),
            eq(refreshTokens.revoked, false),
            gt(refreshTokens.expiresAt, new Date())
        )})

        if(!session){
            return next()
        }
    }catch (error){
        return next(error)
    }

    req.user = claims
    return next()
}

