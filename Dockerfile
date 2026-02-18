### STAGE 1: Build Angular frontend ###
FROM node:24-alpine AS build-frontend
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build:prod

# Compress assets with gzip + brotli
RUN apk add --no-cache gzip brotli \
 && find /usr/src/app/dist -type f -name '*.js'  -exec gzip  -k -f {} \; \
 && find /usr/src/app/dist -type f -name '*.css' -exec gzip  -k -f {} \; \
 && find /usr/src/app/dist -type f -name '*.js'  -exec brotli -f {} \; \
 && find /usr/src/app/dist -type f -name '*.css' -exec brotli -f {} \;

### STAGE 2: Final image — nginx (frontend) + Python/FastAPI (backend) ###
FROM python:3.14-slim

# Install nginx
RUN apt-get update \
 && apt-get install -y --no-install-recommends nginx \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Copy Angular build
COPY --from=build-frontend /usr/src/app/dist/job-wars/browser /usr/share/nginx/html

# Copy and configure nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Install uv and Python dependencies
WORKDIR /app/back
COPY back/pyproject.toml ./
RUN pip install uv \
 && uv venv .venv \
 && uv pip install --python .venv/bin/python \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.32.0" \
    "websockets>=13.0" \
    "pydantic-settings>=2.0.0"

# Copy FastAPI server source
COPY back/ .

# Add venv to PATH and set PYTHONPATH for flat-layout imports
ENV PATH="/app/back/.venv/bin:$PATH" \
    PYTHONPATH="/app/back"

# Startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Persistent volume for SQLite database
VOLUME ["/data"]

EXPOSE 80
CMD ["/docker-entrypoint.sh"]
