import { checkToken } from "../middlewares/check-token";
import { User } from "../models/user";
import { Router } from "express";

const router = Router();

router.get('/users/:id', checkToken, async (req, res) => {
  const id = req.params.id;

  const user = await User.findById(id, '-password');

  if (!user) {
    res.status(404).json({
      message: 'Usuário não encontrado',
    })
  }

  res.status(200).json({
    user
  })
});


export const userRoutes = router;