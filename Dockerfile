FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

# Vite only exposes env vars that exist at build time.
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN}
ENV VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID}

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build:prod

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/server

COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server/main.py ./
COPY server/api ./api
COPY server/config ./config
COPY server/database ./database
COPY server/schemas ./schemas
COPY server/services ./services
COPY server/utils ./utils
COPY --from=frontend-builder /app/client/dist /app/client/dist

EXPOSE 8080

# Ensure schema exists, then start the API which serves the built frontend.
CMD ["sh", "-c", "python -m database.createDatabase && python main.py"]
