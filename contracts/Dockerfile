FROM node:22-alpine


RUN apk add --no-cache bash git python3 make g++ curl ca-certificates


WORKDIR /app


COPY package*.json ./


RUN npm install


RUN mkdir -p /app/source /app/deployed /app/scripts


VOLUME ["/app/source", "/app/deployed", "/app/scripts"]


CMD ["/bin/bash"]
