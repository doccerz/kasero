FROM node:24-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --no-package-lock

COPY . .

EXPOSE 3001

CMD ["node", "-e", "console.log('Kasero starting...')"]
