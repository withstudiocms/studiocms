# Global Variables
ARG ASTRO_DB_REMOTE_URL
ARG ASTRO_DB_APP_TOKEN
ARG CMS_ENCRYPTION_KEY

# Build
FROM node:22.19 AS builder
WORKDIR /app
COPY . .
RUN npm install --global corepack@latest
RUN corepack enable pnpm
RUN pnpm ci:install

ENV ASTRO_DB_REMOTE_URL=$ASTRO_DB_REMOTE_URL
ENV ASTRO_DB_APP_TOKEN=$ASTRO_DB_APP_TOKEN
ENV CMS_ENCRYPTION_KEY=$CMS_ENCRYPTION_KEY

RUN pnpm build:packages
RUN pnpm playground:build

# Runtime
FROM node:22.19 AS runtime
WORKDIR /app
COPY --from=builder /app .

EXPOSE 4321

ENV HOST=0.0.0.0
ENV PORT=4321
ENV ASTRO_DB_REMOTE_URL=$ASTRO_DB_REMOTE_URL
ENV ASTRO_DB_APP_TOKEN=$ASTRO_DB_APP_TOKEN
ENV CMS_ENCRYPTION_KEY=$CMS_ENCRYPTION_KEY

CMD ["node", "playground/dist/server/entry.mjs"]
