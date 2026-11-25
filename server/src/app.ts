import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import authRoutes from './modules/auth/auth.routes'

const app = express()

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
)

app.use(express.json())

const cookieSecret = process.env.COOKIE_SECRET

if(!cookieSecret){
    throw new Error('COOKIE_SECRET is not configured')
}

app.use(cookieParser(cookieSecret))

app.use('/api/auth', authRoutes)

app.get('/api/health', (req,res) => {
    res.json({
        success: true,
        message: 'APIs are running'
    })
})

export default app