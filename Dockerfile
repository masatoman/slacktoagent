FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=development

# 開発環境
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 本番環境
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force
COPY . .
EXPOSE 3000
USER node
CMD ["npm", "start"] 