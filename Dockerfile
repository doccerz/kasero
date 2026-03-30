FROM node:24-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm install --no-package-lock

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
RUN npm run build

FROM node:24-alpine AS web-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/web
RUN npm run build

FROM node:24-alpine AS web-runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Manila
COPY --from=web-builder /app/apps/web/.next/standalone ./
COPY --from=web-builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "server.js"]

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Manila
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/drizzle ./drizzle
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/src/main.js"]
