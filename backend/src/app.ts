import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();

const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Handle CORS preflight BEFORE helmet — Authorization header triggers preflight
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Austrian Car Leasing API',
      version: '1.0.0',
      description: 'KFZ Leasing Platform API — VÖL / VKrG 2010 compliant',
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
}, router);
app.use(errorHandler);

export default app;
