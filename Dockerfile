# ==========================================
# STAGE 1: Build Frontend Assets
# ==========================================
FROM node:22-alpine AS build-stage

WORKDIR /app

# Copy dependency catalogs
COPY package*.json ./

# Install all dependencies (including devDependencies like Vite)
RUN npm install

# Copy project files
COPY . .

# Build the React + Tailwind v4 production assets into 'dist' folder
RUN npm run build

# ==========================================
# STAGE 2: Runner Container
# ==========================================
FROM node:22-alpine AS production-stage

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency catalogs
COPY package*.json ./

# Install only production-only dependencies
RUN npm install --omit=dev

# Copy Express server entrypoint
COPY server.js ./

# Copy compiled frontend from Stage 1 into 'dist'
COPY --from=build-stage /app/dist ./dist

# Expose server port
EXPOSE 3000

# Start Express Fullstack Server
CMD ["node", "server.js"]
