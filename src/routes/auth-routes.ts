import { z } from "zod";
import { IUser, User } from "../models/user";
import { Router } from "express";
import { sign } from "jsonwebtoken";
import { handleError } from "../utils/error-handler";
import { getToken } from "../utils/get-token";
import axios from "axios";
import { verifyToken } from "../utils/verify-token";
import passport from "passport";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const registerUserSchema = z.object({
      name: z.string({ required_error: "Nome é obrigatório" }),
      email: z.string().email(),
      password: z.string(),
      confirmPassword: z
        .string()
        .refine((value) => value === req.body.password, {
          message: "As senhas devem ser iguais",
        }),
    });

    const data = registerUserSchema.parse(req.body);

    const userExists = await User.findOne({ email: data.email });
    if (userExists) {
      res.status(422).json({ message: "Por favor, utilize outro e-mail!" });
      return;
    }

    const user = new User({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    await user.save();
    res.status(201).json({
      message: "Usuário criado com sucesso",
      name: data.name,
      email: data.email,
    });
  } catch (error) {
    const formattedErrors = handleError(error);
    if (formattedErrors) {
      res.status(400).json({ errors: formattedErrors });
    } else {
      res.status(500).json({ message: "Erro no servidor" });
    }
  }
});

router.post("/login", async (req, res) => {
  const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  const data = loginUserSchema.parse(req.body);
  const user = await User.findOne({ email: data.email });
  if (!user) {
    res.status(401).send({ message: "Usuário não encontrado" });
    return;
  }

  const passwordCheck = await user.comparePassword(data.password);
  if (!passwordCheck) {
    res.status(401).send({ message: "Credenciais inválidas" });
    return;
  }

  const token = sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "24h",
  });
  res
    .status(200)
    .json({
      message: "Login efetuado com sucesso",
      token,
      name: user.name,
      email: user.email,
      userId: user._id,
    });
});

router.get("/google", passport.authenticate("google", { session: false, scope: ["email", "profile"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    const user = req.user as IUser;

    const token = sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    });

    res.redirect(`${process.env.CLIENT_URL}/login/success?token=${token}`);
  }
);

router.get("/validate-token", async (req, res) => {
  const token = getToken(req);

  if (!token) {
    res.status(401).send({ message: "Token inválido" });
    return;
  }

  try {
    const data: { userId: string } = verifyToken(token) as { userId: string };
    const user = await User.findById(data.userId);
    if (!user) {
      res.status(401).send({ message: "Usuário não encontrado" });
      return;
    }

    const sessionUser = {
      id: user._id,
      name: user.name,
      email: user.email,
    }

    res
      .status(200)
      .json({ token, user: sessionUser });
  } catch (err) {
    console.log(err);
    res.status(401).send({ error: true, message: "Token inválido" });
  }
});


router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      res.status(500).json({ message: "Erro ao deslogar" });
      return;
    }
    res.status(200).json({ message: "Logout efetuado com sucesso" });
  });

  res.redirect(`${process.env.CLIENT_URL}/login`);
});

export const authRoutes = router;
