import type {CookieOptions, Request, Response} from 'express'
import {success, z} from 'zod'

import { login } from './auth.service'

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
})

function setAuthCookies(res: Response, accessToken: string, refreshToken: string){
    const isProduction = process.env.NODE_ENV === 'production'

    const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        path: '/'
    }

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 30 * 60 * 1000
    })

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

export async function loginController(req: Request, res: Response) {
    const result = loginSchema.safeParse(req.body)

    if(!result.success){
        return res.status(400).json({
            sucess: false,
            errors: result.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        })
    }

    try{
        const loginResult = await login(result.data)

        if(!loginResult){
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            })
        }

        setAuthCookies(res, loginResult.accessToken, loginResult.refreshToken)

        res.setHeader('Cache-Control', 'no-store')

        return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            user: loginResult.user
        })
    }catch {
        return res.status(500).json({
            success: false,
            message: 'Unable to log in. Please try again later'
        })
    }
}

