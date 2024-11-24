FROM mcr.microsoft.com/devcontainers/javascript-node:1-20@sha256:8f4a68a4ebc64c814b962f4a41bbb1116b17f41b2e717d6d81d0ae24f73e1670

# Enable Proto
RUN curl -fsSL https://moonrepo.dev/install/proto.sh | bash -s -- --yes

# Change default Node version
RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install 20.14.0"

# Enable corepack (incase proto fails)
RUN corepack enable pnpm

# Copy welcome message
COPY welcome-message.txt /usr/local/etc/vscode-dev-containers/first-run-notice.txt
