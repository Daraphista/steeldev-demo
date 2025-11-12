# Dockerfile
FROM node:20-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
  wget \
  libnss3 \
  libatk-bridge2.0-0 \
  libxkbcommon0 \
  libgtk-3-0 \
  libdrm2 \
  libgbm1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
CMD ["node", "server.js"]
