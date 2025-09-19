FROM node:22.19 AS runtime
WORKDIR /app

COPY . .

# Setup PNPM
RUN npm install --global corepack@latest
RUN corepack enable pnpm

# Install Deps
RUN pnpm ci:install

# Build all Workspace packages
RUN pnpm build:packages

# Build playground and publish
RUN pnpm playground:build

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD node ./playground/dist/server/entry.mjs