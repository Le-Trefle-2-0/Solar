FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (root workspace)
COPY package*.json ./
COPY apps ./apps
COPY prisma ./prisma
COPY tsconfig.json ./tsconfig.json
RUN npm ci --ignore-scripts

# Copy the rest
COPY . .

# Build API
RUN npm run build:api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/generated ./generated

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
