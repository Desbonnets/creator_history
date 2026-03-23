# === Build stage ===
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# === Production stage ===
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Dossiers persistants (montés en volume en prod)
RUN mkdir -p data backups

EXPOSE 3001

CMD ["node", "dist/index.js"]
