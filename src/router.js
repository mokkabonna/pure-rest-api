'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var Ajv = require('ajv')
var fs = require('fs')
var got = require('got')
var uuidv4 = require('uuid/v4')
var URI = require('uri-js')
var httpProxy = require('http-proxy')
var queryString = require('query-string')
const traverse = require('json-schema-traverse')
var pointer = require('json-pointer')
var serialize = require('serialize-javascript')
var Mustache = require('mustache')

const notEmpty = s => s !== ''
var proxy = httpProxy.createProxyServer({
  xfwd: true
})
const app = express()

app.set('view engine', 'pug')

function createRequestObject(req, config) {
  var request = Object.create(null)

  var hostPort = req.get('host').split(':')
  var host = hostPort[0]
  var port = hostPort[1]

  var url = {
    protocol: req.protocol,
    host: host.split('.').reverse(),
    port: parseInt(port),
    path: req.path.slice(1).split('/').filter(notEmpty)
  }

  request.headers = req.headers
  request.operation = {
    method: req.method,
    url
  }

  return request
}

var transformers = {
  number: function(val) {
    return parseFloat(val)
  },
  integer: function(val) {
    return parseInt(val, 10)
  }
}

function parse(url, parser) {
  traverse(parser.schema, function(schema, point, _, __, keyword, ____, prop) {
    if (!point) return
    var transformer = transformers[schema.transform]
    var propPointer = point.replace(/properties|items/g, '').split('//').join('/')
    var hasProp = pointer.has(url, propPointer)
    if (transformer && hasProp) {
      pointer.set(url, propPointer, transformer(pointer.get(url, propPointer)))
    }
  })
  return url
}

var allTargets


var optionsRoute = {
  target: 'http://localhost:3000',
  schema: {
    properties: {
      method: {
        const: ['OPTIONS']
      },
      url: {
        properties: {
          path: {
            maxItems: 0
          }
        }
      }
    }
  }
}

var routerConfig

app.post('/', function(req, res, next) {
  if (routerConfig) {
    next()
  } else {
    var middleware = bodyParser.json()
    middleware(req, res, function() {
      if (req.body) {
        routerConfig = req.body
        got(req.body.configURL, {
          json: true,
        }).then(function(response) {
          res.status(201).send(req.body)
        }).catch(function(err) {
          // TODO handle invalid config based on json schema
          if (err.response && err.response.statusCode === 404) {
            res.status(400).send('Could not find the router config.')
          } else {
            res.status(500).send(500)
          }
        })
      } else {
        res.status(400).send('Invalid config')
      }
    })
  }
})


function getRequestUrl(req) {
  return req.protocol + '://' + req.get('host') + req.originalUrl
}


app.use(function(req, res, next) {
  if (routerConfig) {
    next()
  } else {
    fs.readFile('public/js/config-client.js', 'utf-8', function(err, contents) {
      if (err) {
        res.send(500).send()
      } else {
        res.set('content-type', 'text/javascript')
        res.send(Mustache.render(contents, {
          url: getRequestUrl(req)
        }))
      }
    })
  }
})

function getBase() {

}

app.use(function(req, res) {
  Promise.all([
    got(routerConfig.configURL, {
      json: true
    }),
    got('http://localhost:3100/*', {
      json: true
    })
  ]).then(function(responses) {

    var ajv = new Ajv()
    var config = responses[0].body.data
    var allUrls = responses[1].body

    if (!config.routes.length || !allUrls.length) {
      renderOptions(res)
      return
    }

    var request = createRequestObject(req)

    // If preprocessed resource
    if (allUrls.indexOf(req.originalUrl)) {
      proxy.web(req, res, {
        target: 'http://localhost:3001'
      })
      return
    }

    var parsers = config.parsers.filter(function(parser) {
      return ajv.validate(parser.schema, request.url)
    })

    request.url = parsers.reduce(parse, request.url)

    var route = config.routes.find(function(route) {
      return ajv.validate(route.schema, request.url)
    })

    if (route) {
      req.originalUrl = 'FOOOOOOOOOOOOBAR'
      proxy.web(req, res, {
        target: route.target,
        forward: 'FOOOOOOOOOOOOOOOOOOOOOOOO'
      })
    } else {
      // TODO supply a representation of almost matching urls of preprocessed resources
      // and for dynamic resources forms for creating valid urls
      res.status(404).send()
    }
  }).catch(function(err) {
    console.log(err)
    if (err.response && err.response.statusCode === 404) {
      renderOptions(res)
    } else {
      res.status(500).render('500')
    }
  })
})

module.exports = app
