import { Router } from "express";
import { StoryController } from "../modules/story/controllers/story-controller";

const storyRoutes = Router()
const storyController = new StoryController();

storyRoutes.post('/', (req, res) => storyController.create(req, res));
storyRoutes.patch('/:id/score', (req, res) => storyController.updateScore(req, res));
storyRoutes.get('/session/:sessionToken', (req, res) => storyController.listBySession(req, res));
storyRoutes.delete('/:id', (req, res) => storyController.delete(req, res));

export {storyRoutes}