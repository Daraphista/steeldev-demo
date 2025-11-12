# ──────────────────────────────────────────────
# 1️⃣ Base image — includes Chromium + Playwright already installed
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

# ──────────────────────────────────────────────
# 2️⃣ Set working directory inside container
WORKDIR /app

# ──────────────────────────────────────────────
# 3️⃣ Copy package definitions first (better cache)
COPY package*.json ./

# ──────────────────────────────────────────────
# 4️⃣ Install Node dependencies
RUN npm install --omit=dev

# ──────────────────────────────────────────────
# 5️⃣ Copy your source files into the image
COPY . .

# ──────────────────────────────────────────────
# 6️⃣ Optional: Playwright verify step (ensures browsers exist)
RUN npx playwright install --with-deps chromium

# ──────────────────────────────────────────────
# 7️⃣ Set environment variable for Cloud Run (Steel API key injected securely)
ENV NODE_ENV=production
# (Cloud Run will set STEEL_API_KEY at runtime)

# ──────────────────────────────────────────────
# 8️⃣ Default start command
CMD ["node", "script.js"]
