# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY gateway/ gateway/
COPY infrastructure/ infrastructure/
COPY scripts/ scripts/
COPY services/ services/
COPY shared/ shared/

RUN npm run build

# Stage 2: Production Run
FROM node:18-alpine

WORKDIR /app

# Only install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled dist from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory for local media (if Cloudinary is unused)
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
