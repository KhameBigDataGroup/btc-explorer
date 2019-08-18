# Blockchain explorer

# Features

* Browse blocks
* View block details
* View transaction details
* Search by transaction ID, block hash and block height
* Support for any Bitcoin-RPC-protocol-compliant coin can be added easily
* Support for BTC is included
* Use redis cache to prevent additional load to node

# Quick start

Configuration options may be passed in `app/environment.js`

## Run via Docker
```
$ docker build -t btc-explorer .

$ docker run -d --name btc-explorer -p 3002:3002 btc-explorer 
```

## Setting up reverse proxy

Create a `default.conf` with your preferred config
```
server {
    listen 80;

    server_name nginx;

    location / {
        proxy_pass http://172.17.0.1:3002;
    }
}
```

Create a `Dockerfile` for nginx
```
FROM nginx
 
RUN rm /etc/nginx/conf.d/default.conf 
 
COPY default.conf /etc/nginx/conf.d
```

Run nginx docker
```
$ docker build -t nginx-node-reverse-proxy .

$ docker run -d --name nginx-node-reverse-proxy -p 80:80 nginx-node-reverse-proxy

$ sudo ufw allow 'Nginx HTTP'
```