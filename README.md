# snapAround

[![Circle CI](https://circleci.com/gh/rricard/snap-around.svg?style=svg&circle-token=c8555431c981b376ab27ac2b3e8414502cf25f62)](https://circleci.com/gh/rricard/snap-around)
Share something with your friends and make them come to you

## Install

Clone the repository and vagrant up/ssh:

```shell
$ git clone https://github.com/rricard/snap-around.git
$ cd snap-around
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

## Author

Robin Ricard
 ([ricard.robin@gmail.com](mailto:ricard.robin@gmail.com)) 

