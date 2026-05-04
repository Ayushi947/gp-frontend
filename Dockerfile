# -------------------------
# Stage 1: Dependencies
# -------------------------
  FROM node:24-alpine AS deps
  WORKDIR /app
  
  COPY package.json package-lock.json* ./
  RUN npm ci
  
  
  # -------------------------
  # Stage 2: Builder
  # -------------------------
  FROM node:24-alpine AS builder
  WORKDIR /app
  
  ENV NODE_ENV=production
  ENV NEXT_TELEMETRY_DISABLED=1
  
  ENV NEXTAUTH_URL=https://app-dev.glidingpath.co
  ENV NEXT_PUBLIC_API_BASE_URL=http://13.204.9.137:9090/v1/api
  ENV NEXTAUTH_SECRET=SqdDXzpm+HEvHh2rRLksZbJ6gxs861LEvyz9ZlUlMp4=

  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  
  RUN npm run build
  
  
  # -------------------------
  # Stage 3: Runner (STANDALONE)
  # -------------------------
  FROM node:24-alpine AS runner
  WORKDIR /app

  # Install wget for healthchecks
  RUN apk add --no-cache wget

  ENV NODE_ENV=production
  ENV NEXT_TELEMETRY_DISABLED=1
  ENV HOSTNAME=0.0.0.0
  
  ENV NEXTAUTH_URL=https://app-dev.glidingpath.co
  ENV NEXT_PUBLIC_API_BASE_URL=http://13.204.9.137:9090/v1/api
  ENV NEXTAUTH_SECRET=SqdDXzpm+HEvHh2rRLksZbJ6gxs861LEvyz9ZlUlMp4=

  # Create non-root user
  RUN addgroup --system --gid 1001 nodejs \
   && adduser --system --uid 1001 nextjs
  
  # ✅ Copy ONLY standalone output
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/.next/standalone ./
  COPY --from=builder /app/.next/static ./.next/static
  
  RUN chown -R nextjs:nodejs /app
  USER nextjs
  
  EXPOSE 3000
  
  # ✅ Standalone server
  CMD ["node", "server.js"]



  
