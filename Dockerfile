# Build stage
FROM node:iron-alpine3.19 as builder

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY src src
# COPY .env .env
COPY tsconfig.json tsconfig.json
RUN pnpm build

#Run stage
FROM node:gallium-alpine3.16
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder app/dist ./dist
# COPY .env .env
CMD ["npm", "start"]
