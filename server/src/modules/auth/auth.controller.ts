import type {CookieOptions, Request, Response} from 'express'
import {success, z} from 'zod'

import { login, logout, refresh, register } from './auth.service'
import { AuthenticateRequest } from '../../middleware/authenticateAccessToken'

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

function clearAuthCookies(res: any){
    const isProduction = process.env.NODE_ENV === 'production'

    const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        path: '/'
    }

    res.clearCookie('accessToken', cookieOptions)
    res.clearCookie('refreshToken', cookieOptions)
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
    }catch (error){
        console.log(error)

        return res.status(500).json({
            success: false,
            message: 'Unable to log in. Please try again later'
        })
    }
}

const registrationSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(40, 'Max of 40 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Max of 50 characters'),
    username: z.string().min(3, 'Username is required').max(50, 'Max of 50 characters'),
    password: z.string().min(8, 'Password must be atleast 8 characters').max(124, 'Max of 124 characters')
})

export async function registrationController(req: Request, res: Response){
    const result = registrationSchema.safeParse(req.body)

    if(!result.success){
        return res.status(400).json({
            sucess: false,
            errors: result.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        })
    }

    try{
        const registrationResult = await register(result.data)

        if(!registrationResult){
            return res.status(401).json({
                success: false,
                message: 'Username already taken'
            })
        }

        setAuthCookies(res, registrationResult.accessToken, registrationResult.refreshToken)

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: registrationResult.user
        })

    }catch (error){
        console.log(error)

        return res.status(500).json({
            success: false,
            message: 'Failed to register user'
        })
    }
}


export async function logoutController(req: AuthenticateRequest, res: Response){
    const user = req.user

    if(!user){
        return res.status(401).json({message: 'Authentication required'})
    }
    try{
        const logoutResult = await logout(user.sessionId)

        clearAuthCookies(res)

        return res.status(200).json({
            message: 'Successfully logged out'
        })
    }catch (error){
        console.log(error)

        return res.status(500).json({message: 'Failed to logout'})
    }

}

export async function refreshController(req: AuthenticateRequest, res: Response){
    res.setHeader('Cache-Control', 'no-store')

    const user = req.user
    const currentRefreshToken = req.cookies.refreshToken

    if(!user || typeof currentRefreshToken !== 'string' || !currentRefreshToken){
        return res.status(401).json({message: 'Invalid session'})
    }

    try{
        const refreshResult = await refresh(user.userId, user.sessionId, currentRefreshToken)

        if(!refreshResult){
            return res.status(401).json({message: 'Refresh token expired, revoked or already used'})
        }

        setAuthCookies(res, refreshResult.accessToken, refreshResult.newRefreshToken)

        return res.status(200).json({message: 'Tokens refreshed successfully'})
    }catch (error){

        console.log(error)

        return res.status(500).json({message: 'Failed to refresh tokens'})
    }
}


