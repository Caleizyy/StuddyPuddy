# Frontend image: builds the React app, then serves the static files with nginx.
# nginx also forwards /api to the backend, so the browser only ever talks to one address.
# Build from the repository root (docker compose does this for you).

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend --include-workspace-root=false --ignore-scripts
COPY frontend frontend
# An empty API address makes the app call "/api" on the same host it was loaded from
ENV VITE_API_URL=""
RUN npm run build --workspace frontend

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
