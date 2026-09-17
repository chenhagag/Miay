# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies
RUN npm ci

# Copy source code
COPY client/ ./client/
COPY server/ ./server/

# Generate Prisma client
RUN cd server && npx prisma generate

# Build frontend
RUN npm run build -w client

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/server/ ./server/
COPY --from=builder /app/client/dist/ ./client/dist/
COPY --from=builder /app/node_modules/ ./node_modules/

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server/src/index.js"]
