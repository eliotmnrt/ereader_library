ARG NODE_VERSION=24

# ---------- build: install all deps (incl. dev) and copy sources ----------
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY tests ./tests

# ---------- test: run the suite; the build fails if a test fails ----------
FROM build AS test
ENV NODE_ENV=test
RUN npm test

# ---------- prod: production deps only, non-root, no tests ----------
FROM node:${NODE_VERSION}-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/server.js"]
