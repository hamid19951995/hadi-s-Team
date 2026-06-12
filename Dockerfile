# =========================================================
# Stage 1: Frontend Build Phase (NodeJS Environment)
# =========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Enable caching of dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy engineering sources
COPY . .

# Compile React production bundle
RUN npm run build

# =========================================================
# Stage 2: Serve Phase (Python FastAPI Core Engine)
# =========================================================
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Optimize Python execution
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files and built compiled static assets
COPY --from=builder /app/dist ./dist
COPY engine/ ./engine/
COPY schemas.py ./
COPY main.py ./

EXPOSE 3000

# Execute server on Port 3000 mapping container default path boundaries
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
