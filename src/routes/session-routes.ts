import { Router } from 'express'
import { z } from 'zod'
import { Session } from '../models/session'
import { verifyToken } from '../utils/verify-token'
import { nanoid } from 'nanoid'
import { getToken } from '../utils/get-token'

const router = Router()

router.use((req, res, next) => {
  const token = getToken(req)
  if (!token) {
    res.status(401).json({ message: 'Token não fornecido' })
    return
  }

  try {
    const decoded = verifyToken(token)
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido' })
    return
  }
})

router.post('/create', async (req, res) => {
  const sessionSchema = z.object({
    title: z.string()
  })

  try {
    const { title } = sessionSchema.parse(req.body)
    const token = nanoid(10)

    const sessionExists = await Session.findOne({ token })
    if (sessionExists) {
      res.status(400).json({ message: 'Token já utilizado para outra sessão' })
      return
    }

    const session = new Session({
      title,
      token,
      owner: req.userId,
      votes: []
    })

    await session.save()

    res.status(201).json({ message: 'Sessão criada com sucesso', session })
  } catch (err) {
    res.status(400).json({ message: 'Erro ao criar a sessão', error: err })
  }
})

// Verificar se sessão existe
router.get('/exists/:token', async (req, res) => {
  const { token } = req.params

  try {
    const session = await Session.findOne({ token })
    if (session) {
      res
        .status(200)
        .json({ message: 'Sessão encontrada', exists: true, session })
    } else {
      res.status(404).json({ message: 'Sessão não encontrada', exists: false })
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Erro ao verificar a sessão', error: err })
  }
})

router.post('/join/:token', async (req, res) => {
  const { token } = req.params

  try {
    const session = await Session.findOne({ token })

    if (!session) {
      res.status(404).json({ message: 'Sessão não encontrada' })
      return
    }

    res.status(200).json({ message: 'Entrou na sessão com sucesso', session })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao entrar na sessão', error: err })
  }
})

// Atualizar votos
router.post('/vote/:token', async (req, res) => {
  const { token } = req.params
  const voteSchema = z.object({
    vote: z.string()
  })

  try {
    const { vote } = voteSchema.parse(req.body)

    const session = await Session.findOne({ token })
    if (!session || session.closed) {
      res.status(400).json({ message: 'Sessão indisponível para votos' })
      return
    }

    session.votes.push({ userId: req.userId as string, vote })
    await session.save()

    res.status(200).json({ message: 'Voto registrado com sucesso', session })
  } catch (err) {
    res.status(400).json({ message: 'Erro ao votar', error: err })
  }
})

// Encerrar uma sessão
router.post('/close/:token', async (req, res) => {
  const { token } = req.params

  try {
    const session = await Session.findOne({ token })

    if (!session) {
      res.status(404).json({ message: 'Sessão não encontrada' })
      return
    }

    if (session.owner !== req.userId) {
      res
        .status(403)
        .json({ message: 'Apenas o criador pode encerrar a sessão' })
      return
    }

    session.closed = true
    await session.save()

    res.status(200).json({ message: 'Sessão encerrada com sucesso' })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao encerrar a sessão', error: err })
  }
})

export const sessionRoutes = router
