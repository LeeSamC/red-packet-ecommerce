import { and, eq, gt } from "drizzle-orm";
import { db } from "../../db";
import { refreshTokens, users } from "../../db/schema";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {hash, randomUUID} from 'node:crypto'
import { hashToken } from "../../utils/hashToken";

type loginInput = {
    username: string,
    password: string
}

function issueAccessToken(userId: string, sessionId: string){
    if(!process.env.ACCESS_TOKEN_SECRET){
        throw new Error('Access token secret not configured')
    }

    return jwt.sign({userId, sessionId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m', algorithm: 'HS256'})
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

type registrationInput = {
    firstName: string,
    lastName: string,
    username: string,
    password: string
}


export async function register({firstName, lastName, username, password}: registrationInput){
    const existingUser = await db.query.users.findFirst({where: 
        eq(users.username, username)
    })

    if(existingUser){
        return null
    }
    const passwordHash = await bcrypt.hash(password, 12)

    const registration = await db.transaction(async tx => {
        const [user] = await tx.insert(users).values({
            firstName,
            lastName,
            username,
            passwordHash
        }).onConflictDoNothing({target: users.username}).returning({
            userId: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username
        })

        if(!user){
            return null
        }

        const sessionId = randomUUID()

        const accessToken = issueAccessToken(user.userId, sessionId)
        const refreshToken = issueRefreshToken(user.userId)

        await tx.insert(refreshTokens).values({
            id: sessionId,
            tokenHash: hashToken(refreshToken),
            userId: user.userId,
            expiresAt: new Date( Date.now() + 7 * 24 * 60 * 60 * 1000),
            revoked: false
        })

        return {user, accessToken, refreshToken}
    })

    if(!registration){
        return null
    }

    return {
        accessToken: registration.accessToken,
        refreshToken: registration.refreshToken,
        user: registration.user
    }


}

export async function logout(sessionId: string) {

    await db.update(refreshTokens).set({
        revoked: true
    })
    .where(eq(refreshTokens.id, sessionId))
    
}

export async function refresh(userId: string, sessionId: string, currentRefreshToken: string){
    
    const accessToken = issueAccessToken(userId, sessionId)
    const newRefreshToken = issueRefreshToken(userId)

    const [updatedSession] = await db.update(refreshTokens).set({
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .where(
        and(
            eq(refreshTokens.id, sessionId),
            eq(refreshTokens.userId, userId),
            eq(refreshTokens.tokenHash, hashToken(currentRefreshToken)),
            eq(refreshTokens.revoked, false),
            gt(refreshTokens.expiresAt, new Date())
        )
    )
    .returning({id: refreshTokens.id})

    if(!updatedSession){
        return null
    }

    return {
        accessToken,
        newRefreshToken
    }
}