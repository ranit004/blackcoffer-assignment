# Backend API image (production dependencies only).
FROM node:22-alpine

WORKDIR /app

# Install prod deps first for better layer caching. Dev-only deps (mongodb-memory-server,
# vitest, etc.) are omitted — the container talks to a real MongoDB via MONGODB_URI.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["npm", "start"]
