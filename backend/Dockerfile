FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
RUN mkdir -p /shared-documents && chown -R node:node /app /shared-documents

USER node
EXPOSE 4000
CMD ["node", "src/server.js"]
