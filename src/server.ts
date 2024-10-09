import express from 'express';
import mongoose from 'mongoose';
import bcrypt, { genSalt } from 'bcrypt';
import { configDotenv } from 'dotenv';
import { z } from 'zod';
import { handleError } from './utils/error-handler';
import { User } from './models/user';

configDotenv();
const app = express();

app.use(express.json())

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hello World!'
  });
});

app.post('/auth/register', async (req, res) => {

  try {
    const registerUserSchema = z.object({
      name: z.string({ required_error: 'Nome é obrigatório' }),
      email: z.string().email(),
      password: z.string(),
      confirmPassword: z.string().refine((value) => value === req.body.password, { message: 'As senhas devem ser iguais' })
    });

    const data = registerUserSchema.parse(req.body)

    const userExists = await User.findOne({ email: data.email });

    if (userExists) {
      res.status(422).json({
        message: 'Por favor, utilize outro e-mail!'
      })
      return
    }

    const salt = await genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = new User({
      name: data.name,
      email: data.email,
      password: passwordHash
    });

    await user.save();

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      name: data.name,
      email: data.email,
    })
    return
  } catch (error) {
    const formattedErrors = handleError(error);
    if (formattedErrors) {
      res.status(400).json({ errors: formattedErrors });
    } else {
      res.status(500).json({ message: 'Erro no servidor' });
    }
  }
});

app.post('/auth/login', async (req, res) => {
  const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string()
  })

  const data = loginUserSchema.parse(req.body)

  const user = User.findOne({ email: data.email });
  if (!user) {
    res.status(404).json({
      message: 'Usário não encontrado',
    })
    return
  }
})

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

mongoose.connect(`mongodb+srv://${dbUser}:${dbPass}@cluster.iso2u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster`).then(() => {
  app.listen(4000, () => {
    console.log('Listening on port 4000');
  });

  console.log('Connected to MongoDB');
})
