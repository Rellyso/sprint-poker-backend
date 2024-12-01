import { z } from "zod";

export const CreateStorySchema = z.object({
  name: z.string().min(1, "O nome da história é obrigatório"),
  code: z.string().min(1, "O código da história é obrigatório"),
  link: z.string().url().optional(),
  description: z.string().optional(),
  sessionToken: z.string().min(1, "Token da sessão é obrigatório")
});

export const UpdateStoryScoreSchema = z.object({
  score: z.number().min(0, "Pontuação deve ser um número não negativo")
});