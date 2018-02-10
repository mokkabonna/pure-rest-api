'use strict'
var express = require('express')
var bodyParser = require('body-parser')
const app = express()
var Ajv = require('ajv')
var got = require('got')
var uuidv4 = require('uuid/v4')
var httpProxy = require('http-proxy')
var queryString = require('query-string')
const traverse = require('json-schema-traverse')
var pointer = require('json-pointer')

const notEmpty = s => s !== ''
var proxy = httpProxy.createProxyServer()

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
  request.method = req.method
  request.url = url

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

app.use(function(req, res) {
  got('http://localhost:3100/18e91663-290f-4eeb-967f-32e2c7224b52', {
    json: true
  }).then(function(response) {
    var ajv = new Ajv()
    var config = response.body.data
    var request = createRequestObject(req)

    var parsers = config.parsers.filter(function(parser) {
      return ajv.validate(parser.schema, request.url)
    })

    request.url = parsers.reduce(parse, request.url)

    var route = config.routes.find(function(route) {
      return ajv.validate(route.schema, request.url)
    })

    console.log(request.url)

    if (route) {
      proxy.web(req, res, {
        target: route.target
      })
    } else {
      res.status(404).send()
    }
  })
})

module.exports = app
