FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Drop privileges
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Local fallback uploads dir (overridden in prod by Cloudinary)
RUN mkdir -p /app/uploads && chown -R app:app /app

USER app

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
