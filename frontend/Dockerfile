# Frontend image — runs the Vite dev server for easy local review.
# (For a real production deploy you'd `npm run build` and serve dist/ via nginx; the dev
# server is used here to keep local review one command.)
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host exposes the dev server outside the container so the host browser can reach it.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
