# Dockerfile
FROM node:20-alpine

# Dépendances utiles
RUN apk add --no-cache git bash curl

WORKDIR /app

EXPOSE 8081 19000 19001 19002 19006

CMD [ "sh" ]
