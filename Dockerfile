FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/server

COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./
COPY --from=frontend-builder /app/client/dist /app/client/dist

EXPOSE 8000

# Ensure schema exists, then start the API which serves the built frontend.
CMD ["sh", "-c", "python -m database.createDatabase && python main.py"]
