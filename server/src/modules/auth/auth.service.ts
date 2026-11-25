import { eq } from "drizzle-orm";
import { db } from "../../db";
import { refreshTokens, users } from "../../db/schema";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {randomUUID} from 'node:crypto'
import { hashToken } from "../../utils/hashToken";

type loginInput = {
    username: string,
    password: string
}

function issueAccessToken(userId: string, sessionId: string){
    if(!process.env.ACCESS_TOKEN_SECRET){
        throw new Error('Access token secret not configured')
    }

    return jwt.sign({userId, sessionId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30', algorithm: 'HS256'})
}

function issueRefreshToken(userId: string) {
    if(!process.env.REFRESH_TOKEN_SECRET){
        throw new Error('Refresh token secret not configured')
    }

    return jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d', jwtid: randomUUID()})
}


export async function login({username, password}: loginInput){
    const user = await db.query.users.findFirst({where: 
        eq(users.username, username)
    })

    if(!user){
        return null
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)

    if(!validPassword){
        return null
    }

    const sessionId = randomUUID()

    const accessToken = issueAccessToken(user.id, sessionId)
    const refreshToken = issueRefreshToken(user.id)

    await db.transaction(async (tx) => {
        await tx.delete(refreshTokens).where(
            eq(refreshTokens.userId, user.id)
        )

        await tx.insert(refreshTokens).values({
            id: sessionId,
            tokenHash: hashToken(refreshToken),
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            revoked: false
        })
    })

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName
        }
    }


}