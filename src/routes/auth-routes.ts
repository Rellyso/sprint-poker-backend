import { z } from "zod";
import { User } from "../models/user";
import { Router } from "express";
import { sign } from "jsonwebtoken";
import { handleError } from "../utils/error-handler";

const router = Router();

router.post('/register', async (req, res) => {
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

    const user = new User({
      name: data.name,
      email: data.email,
      password: data.password,
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

router.post('/login', async (req, res) => {
  const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string()
  })

  const data = loginUserSchema.parse(req.body)

  const user = await User.findOne({ email: data.email });

  console.log(user)

  if (!user) {
    res.status(401).json({
      message: 'Usuário não encontrado',
    })
    return
  }

  const passwordCheck = await user?.comparePassword(data.password);

  if (!passwordCheck) {
    res.status(401).json({
      message: 'Credenciais inválidas',
    })
    return
  }

  const token = sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '24h' });

  res.status(200).json({
    message: 'Login efetuado com sucesso',
    token,
  })
})

export const authRoutes = router;