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
var parseRequest = require('./utils/parse-request')
var configMiddleware = require('./middleware/config')
var proxy = httpProxy.createProxyServer()

const app = express()
var ajv = new Ajv()
app.set('view engine', 'pug')

app.use(configMiddleware)

app.use(function(req, res) {
  got(app.locals.config.configURL, {
    json: true
  }).then(function(response) {
    var config = response.body.data
    var requestResponse = {
      request: parseRequest.parse(req, config.parsers, ajv),
      response: {

      }
    }
    var route = config.routes.find(function(route) {
      return ajv.validate(route.schema, requestResponse.request.operation)
    })

    if (route) {
      if (route.proxy) {
        proxy.web(req, res, {
          target: route.proxy.target
        })
      } else {
        var resolveResponse
        var rejectResponse
        var responsePromise = new Promise(function(resolve, reject) {
          resolveResponse = resolve
          rejectResponse = reject
        })

        var currentReqRes
        for (var i = 0; i < route.steps.length; i++) {
          var currentStep = route.steps[i]

          responsePromise = responsePromise.then(function() {
            return got.post(currentStep.href, {
              json: true
            }).then(function(response) {
              currentReqRes = response.body
            })
          }, function(err) {
            throw new Error('Step ' + (i + 1) + 'failed.')
          })
        }

        responsePromise.then(function(reqRes) {
          res.status(reqRes.response.statusCode || 200).send(reqRes.body)
        }).catch(function(err) {
          res.status(500).send(err)
        })
      }
    } else {
      res.status(404).send()
    }
  }, function(err) {
    res.status(500).send('Could not get config')
  })
})

module.exports = app
