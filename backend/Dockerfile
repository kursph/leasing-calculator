FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "until npx prisma db push --skip-generate; do echo 'DB not ready, retrying...'; sleep 3; done && npm run prisma:seed && node dist/server.js"]
