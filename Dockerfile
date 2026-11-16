# ---------- Stage 1: build ----------
FROM node:24-slim AS build
WORKDIR /app
ENV SCARF_ANALYTICS=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:24-slim AS runtime
ENV NODE_ENV=production
ENV SCARF_ANALYTICS=false
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist

# Folder for uploaded CVs / company logos (mounted as a volume in compose).
# Change this path if the upload code writes somewhere else.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 3002
CMD ["node", "dist/main"]