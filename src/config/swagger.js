import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cursor Agent API',
      version: '1.0.0',
      description: 'Cursor AgentのAPI仕様書',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3456}`,
        description: '開発サーバー',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'APIキーを指定してください',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/server.js'], // APIルートファイルのパス
};

export const specs = swaggerJsdoc(options); 