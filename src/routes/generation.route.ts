import { Router } from 'express';
import { GenerationController } from '@controllers/generation.controller';
import { Routes } from '@interfaces/routes.interface';

export class GenerationRoute implements Routes {
  public path = '/generate';
  public router = Router();
  public generationController = new GenerationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(this.path, this.generationController.generateContent);
  }
}
