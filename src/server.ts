import dotenv from 'dotenv';

// Загружаем переменные окружения из .env файла
dotenv.config();
import 'reflect-metadata';
import { App } from '@/app';

import { GenerationRoute } from '@routes/generation.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const routes = [new GenerationRoute()];

const app = new App(routes);

app.listen();
