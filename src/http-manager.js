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
      var reqRes = {
        request: parseRequest.parse(req, config.parsers, ajv),
        response: {},
        sources: {}
      }
      var route = config.routes.find(function(route) {
        return ajv.validate(route.schema, reqRes.request.operation)
      })

      if (route) {
        if (!route.steps || !route.steps.length) {
          proxy.web(req, res, {
            target: app.locals.config.persistURL
          })
        } else {
          var steps = route.steps.slice(0)
          var currentReqRes

          var result = []

          var resourceUrl = URI.resolve(app.locals.config.persistURL, reqRes.request.operation.url.originalUrl)

          got(resourceUrl, {
            json: true
          }).then(function(response) {
            reqRes.response.body = response.body
          }).catch(function() {
            //silence if no existing resource found
          }).then(function() {
            return executeProcess(steps, reqRes).then(function(results) {
              var output = results[results.length - 1]
              var response = output.response.body.response
              res.status(response.statusCode || 200).send(response.body)
            })
          }).catch(function(err) {
            res.status(500).send(err)
          })
        }
      } else {
        proxy.web(req, res, {
          target: app.locals.config.persistURL
        })
      }
    },
    function(err) {
      res.status(500).send('Could not get config')
    })
})

function executeProcesses(previous, steps) {
  previous.push(steps.shift())
  return executeProcess(steps)
}

function executeProcess(steps, reqRes) {
  var step = steps.find(s => !s.endTime)
  if (!step) return steps

  step.startTime = new Date()

  return got.post(step.href, {
    json: true,
    body: reqRes
  }).then(function(response) {
    step.response = response
    step.endTime = new Date()
    return executeProcess(steps, response.body)
  }).catch(function(err) {
    step.error = err
    throw err
  })
}

module.exports = app
