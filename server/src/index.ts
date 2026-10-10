import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database';
import { swaggerSpec } from './config/swagger';
import { createApp } from './app';
import { logger } from './config/logger';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

connectDatabase()
  .then(() => {
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('Failed to connect to database', err);
    process.exit(1);
  });

export default app;

