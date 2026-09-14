FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production PORT=8080 BIND_ADDRESS=0.0.0.0
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.mjs stone-adapter.mjs qwen.mjs deployment.mjs context.mjs askstone-sources.mjs ./
COPY src/research.mjs ./src/research.mjs
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
