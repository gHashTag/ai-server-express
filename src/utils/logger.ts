import { existsSync, mkdirSync } from 'fs';
import winston from 'winston';
import morgan from 'morgan';

const logDir = process.env.LOG_DIR || '/tmp/logs';

if (!existsSync(logDir)) {
  try {
    mkdirSync(logDir, { recursive: true });
  } catch (error) {
    console.warn(`Unable to create log directory: ${error.message}`);
  }
}

// Создаем логгер
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'combined.log' })],
});
// Использование logger
logger.info('Server started');
logger.error('Error occurred');

// Создаем разные форматы логирования
const morganDev = morgan('dev', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
});

const morganCombined = morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
});

// Экспортируем функцию для динамического выбора формата
const getDynamicLogger = (format = 'dev') => {
  return format === 'combined' ? morganCombined : morganDev;
};

export { logger, getDynamicLogger };
