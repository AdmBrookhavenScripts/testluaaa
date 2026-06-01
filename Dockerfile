FROM node:20

RUN apt-get update && \
    apt-get install -y lua5.3 python3

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "server.js"]
