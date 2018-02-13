'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var Ajv = require('ajv')
var got = require('./got')
var uuidv4 = require('uuid/v4')
var URI = require('uri-js')
var httpProxy = require('http-proxy')
var queryString = require('query-string')
var serialize = require('serialize-javascript')
var _ = require('lodash')
var accepts = require('accepts')
var parseRequest = require('./utils/parse-request')
var configMiddleware = require('./middleware/config')

var proxy = httpProxy.createProxyServer({
  xfwd: true
})

const app = express()
app.set('view engine', 'pug')
app.use(configMiddleware)

app.use(function(req, res) {
  Promise.all([
    got(app.locals.config.configURL, {
      json: true
    }),
    //TODO add this to config required
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

    var request = parseRequest.parse(req, config.parsers, ajv)
    var route = config.routes.find(function(route) {
      return ajv.validate(route.schema, request.operation)
    })

    if (route) {
      var serverMediaTypes = _.flatten(route.providers.map(p => p.mediaTypes))
      var accept = accepts(req)
      var type = accept.type(serverMediaTypes)
      var provider = route.providers.find(p => p.mediaTypes.indexOf(type) !== -1) || route.providers[0]

      if (provider) {
        proxy.web(req, res, {
          target: provider.target
        })
      } else {
        // TODO supply a representation of almost matching urls of preprocessed resources
        // and for dynamic resources forms for creating valid urls
        proxy.web(req, res, {
          target: app.locals.config.persistURL
        })
      }
    } else {
      proxy.web(req, res, {
        target: app.locals.config.persistURL
      })
    }
  }).catch(function(err) {
    if (err.response && err.response.statusCode === 404) {
      renderOptions(res)
    } else {
      res.status(500).send(err)
    }
  })
})

function renderOptions() {
  throw new Error('Not implemented yet')
}

function findProvider() {

}

module.exports = app
