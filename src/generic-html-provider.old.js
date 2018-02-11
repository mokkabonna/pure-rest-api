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
var serialize = require('serialize-javascript')
var Mustache = require('mustache')
var _ = require('lodash')
var accepts = require('accepts')
var proxy = httpProxy.createProxyServer()
var parseRequest = require('./parse-request')
var configMiddleware = require('./middleware/config')

const app = express()
var ajv = new Ajv()
app.set('view engine', 'pug')

app.use(configMiddleware)

app.use(function(req, res) {
  got(app.locals.config.configURL, {
    json: true
  }).then(function(response) {
    var config = response.body.data
    var request = parseRequest.parse(req, config.parsers, ajv)
    var route = config.routes.find(function(route) {
      return ajv.validate(route.schema, request.operation)
    })

    if (route) {
      return got(route.template, {
        json: true
      }).then(function(response) {

      })
    } else {
      res.status(404).send()
    }
  }).catch(function(err) {
    res.status(500).send(err)
  })
})

module.exports = app
