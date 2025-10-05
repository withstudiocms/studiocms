FROM node:22.19 AS runtime
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
CMD pnpm start
