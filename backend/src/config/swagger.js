import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * OpenAPI spec generated from JSDoc `@openapi` blocks on the route files. Served at
 * /api/docs by swagger-ui-express (wired up in app.js).
 */
export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Blackcoffer Insights API',
      version: '1.0.0',
      description:
        'Read-only API for the Blackcoffer Insights Dashboard. Serves filtered insight ' +
        'records and pre-aggregated chart data from MongoDB.',
    },
    servers: [{ url: 'http://localhost:8000', description: 'Local development' }],
  },
  apis: [path.resolve(__dirname, '../routes/*.js')],
});

export default swaggerSpec;
