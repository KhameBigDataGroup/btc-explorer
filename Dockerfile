FROM node:8
LABEL maintainer="amir77ni@gmail.com"

ENV UV_THREADPOOL_SIZE 16

RUN npm install pm2 --global

WORKDIR /workspace
COPY . .

RUN npm install

EXPOSE 3002

CMD npm start 
#CMD pm2 start bin/www --name "btc-explorer"