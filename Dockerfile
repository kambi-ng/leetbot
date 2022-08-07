# Build stage
FROM node:gallium-alpine3.16 as builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY src src
COPY .env .env
COPY tsconfig.json tsconfig.json
RUN npm run build

#Run stage
FROM node:gallium-alpine3.16
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder app/dist ./dist
COPY .env .env
CMD ["npm", "start"]
