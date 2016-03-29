# SnapAround

1-Share pictures around the world and let everyone know about what you are enjoying.

2-SnapAround. Show people what's happening around you through picture.

## Install

Clone the repository and vagrant up/ssh:

```shell
$ git clone https://github.com/montaltomarco/snaparound-server.git
$ cd snaparound-server
$ vagrant up
$ vagrant ssh
$ cd /vagrant
```

Add `.env` and `test/.env` files with AWS keys (account on which you created 
`snaparound`, `snaparounddev`, `snaparoundtest` buckets) and facebook API keys:

```
S3_KEY=<AWS KEY>
S3_SECRET=<AWS SECRET>
FB_APP_ID=<FB ID>
FB_APP_SECRET=<FB SECRET>
```

## Usage

Start the server:

```shell
$ npm start
```

Then, the api is available at [localhost:3000](http://localhost:3000) and its
doc is available at: [petstore.swagger.io](http://petstore.swagger.io/?url=http://localhost:3000/v1.0/spec.json)

## Spec

TODO: Swagger stuff

## Contribute

Work is done in pull-requests, what's in master is supposed to be stable.

Tests and linter must pass before merging a pull-request:

```shell
$ npm test
$ npm run lint
```

## 2016 Team

Marco Montalto
 ([montaltomarco0@gmail.com](mailto:montaltomarco0@gmail.com)) 

Mehdi Kitane

Ludmila Danilescu
 
 
 
### Special THANKS TO : 
### Robin RICARD (https://github.com/rricard)
### Antoine KEVIN (https://github.com/Skaelv)
### Valetin COMTE (https://github.com/Valentin-Comte)
### Karim BEHMIDA (https://github.com/kar1m) 

####FOR THEIR HARD WORK ON THE SERVER-SIDE AND IOS-APP DEVELOPMENT ON SnapAround 1.0!!!
