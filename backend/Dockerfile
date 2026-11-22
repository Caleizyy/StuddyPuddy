# Backend image: builds the TypeScript, then runs the compiled JavaScript with node.
# Build from the repository root (docker compose does this for you).

FROM node:24-alpine AS build
WORKDIR /app
# Only the package files first, so the dependency layer is cached until they change
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend --include-workspace-root=false --ignore-scripts
COPY backend backend
RUN npm run build --workspace backend

FROM node:24-alpine AS run
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
# Production dependencies only: no TypeScript, test tools or linters in the final image
RUN npm ci --workspace backend --include-workspace-root=false --omit=dev --ignore-scripts
COPY --from=build /app/backend/dist backend/dist
# Do not run as root inside the container
USER node
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/server.js"]
