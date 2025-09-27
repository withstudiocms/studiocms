FROM node:22.19 AS runtime

ARG ASTRO_DB_REMOTE_URL
ARG ASTRO_DB_APP_TOKEN
ARG CMS_ENCRYPTION_KEY
ARG PR_URL

ENV ASTRO_DB_REMOTE_URL=${ASTRO_DB_REMOTE_URL}
ENV ASTRO_DB_APP_TOKEN=${ASTRO_DB_APP_TOKEN}
ENV CMS_ENCRYPTION_KEY=${CMS_ENCRYPTION_KEY}
ENV PR_URL=${PR_URL}

WORKDIR /app

COPY . .

RUN npm install --global corepack@latest
RUN corepack enable pnpm

RUN pnpm ci:install

RUN pnpm build:packages

RUN pnpm playground:build

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD node ./playground/dist/server/entry.mjs