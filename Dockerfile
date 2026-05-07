FROM node:20-alpine

# Pin to the same Claude CLI version that's installed on the Hetzner host.
# Bump together: the auth file format on the host must match what this CLI
# understands, so do not let this drift.
RUN npm install -g @anthropic-ai/claude-code@2.1.37

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
