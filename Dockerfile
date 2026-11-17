# Base Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and build
COPY . .
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary production files
COPY package*.json ./
RUN npm ci --only=production || npm install --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data.json ./data.json

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
