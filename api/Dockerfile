# syntax=docker/dockerfile:1
FROM node:20-alpine

# Tools required to build native deps like better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
EXPOSE 4000
CMD ["npm", "run", "start"]
