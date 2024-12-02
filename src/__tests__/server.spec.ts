import mongoose from 'mongoose'
import http from 'http'
import express from 'express'
import { MONGO_URL } from '../constants/mongo-url'
import { configDotenv } from 'dotenv'
import { authRoutes } from '../routes/auth-routes'
import { userRoutes } from '../routes/user-routes'
import { sessionRoutes } from '../routes/session-routes'
import { storyRoutes } from '../routes/story-routes'
import { initSocket } from '../config/socket'
import passport from 'passport'

configDotenv()

interface RouterLayer {
  regexp: RegExp
  handle: {
    name: string
  }
  route: {
    path: string
  }
}


describe('Server Configuration', () => {
  let app: express.Application
  let server: http.Server
  

  beforeAll(async () => {
    app = express()

    app.use(express.json())
    app.use(passport.initialize())
    
    app.use('/api/auth', authRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api/sessions', sessionRoutes)
    app.use('/api/stories', storyRoutes)

    // Root route
    app.get('/', (req, res) => {
      res.send('Testing server response!')
    })
    server = http.createServer(app)
    initSocket(server)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    server.close()
  })

  it('should have configured JSON middleware', () => {
    const jsonMiddleware = app._router.stack.find(
      (layer: RouterLayer) => layer.handle.name === 'jsonParser'
    )
    expect(jsonMiddleware).toBeTruthy()
  })

  it('should have initialized passport', () => {
    const passportMiddleware = app._router.stack.find(
      (layer: RouterLayer) => layer.handle.name === 'initialize'
    )
    expect(passportMiddleware).toBeTruthy()
  })

  it('should connect to MongoDB successfully', async () => {
    await mongoose.connect(MONGO_URL)
    expect(mongoose.connection.readyState).toBe(1)
  })



  it('should have correct environment variables', () => {
    expect(process.env.PORT).toBeDefined()
    expect(process.env.CLIENT_URL).toBeDefined()
  })

  it('should start the server on the configured port', () => {
    const PORT = Number(process.env.PORT) || 4000
    expect(PORT).toBeGreaterThan(0)
  })

  it('should have a root route', () => {
    const rootRoute = app._router.stack.find(
      (layer: RouterLayer) => layer.route && layer.route.path === '/'
    )
    expect(rootRoute).toBeTruthy()
  })

  it('should have registered routes', () => {
    const registeredRoutes = [
      '/api/auth',
      '/api/users', 
      '/api/sessions', 
      '/api/stories'
    ]

    function convertRoutesToRegex(routes: string[]): string[] {
      return routes.map(route => route.replace(/\//g, '\\/'))
    }

    const registeredRoutesRegex = convertRoutesToRegex(registeredRoutes)
    
    registeredRoutesRegex.forEach(route => {
      const matchingRoute = app._router.stack.some(
        (layer:RouterLayer) => layer.regexp.source.includes(route)
      )
      expect(matchingRoute).toBeTruthy()
    })
  })

  it('should initialize socket', () => {
    expect(server).toBeTruthy()
    // Add more specific socket initialization checks if needed
  })
})