'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var Ajv = require('ajv')
var fs = require('fs')
var got = require('./got')
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

app.use(configMiddleware)
app.use(bodyParser.json())

app.use(function(req, res) {
  got(app.locals.config.configURL).then(function(response) {
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
        proxy.web(req, res, {target: app.locals.config.persistURL})
      } else {
        var currentReqRes
        var result = []
        var resourceUrl = URI.resolve(app.locals.config.persistURL, reqRes.request.operation.url.originalUrl)
        var parentProcessId = reqRes.request.headers['x-correlation-id'] || null
        reqRes.request.headers['x-correlation-id'] = _.uniqueId()

        got(resourceUrl).then(function(response) {
          reqRes.response.statusCode = response.statusCode
          reqRes.response.body = response.body
        }).catch(function(err) {
          reqRes.response.statusCode = err.response.statusCode
          //silence if no existing resource found
        }).then(function() {
          var steps = route.steps.filter((step) => {
            if (!step.testSchema)
              return true
            return ajv.validate(step.testSchema, reqRes)
          })

          return executeProcess(steps, reqRes, app.locals.config.configURL, parentProcessId).then(function(results) {
            var output = results[results.length - 1]
            var response = output.response.response
            res.status(response.statusCode || 200).send(response.body)
          })
        }).catch(function(err) {
          res.status(500).send(err)
        })
      }
    } else {
      proxy.web(req, res, {target: app.locals.config.persistURL})
    }
  }).catch(function(err) {
    res.status(500).send(err.message)
  })
})

var cache = {}

function executeProcess(steps, reqRes, baseUri, parentProcessId) {
  var step = steps.find(s => !s.endTime)
  if (!step)
    return steps

  step.startTime = new Date()
  step.id = _.uniqueId()
  step.input = reqRes

  var processUri = baseUri + '/all/' + (
    parentProcessId
    ? parentProcessId + '/'
    : '') + step.id

  return got.put(processUri, {
    json: true,
    body: {
      data: step,
      links: []
    }
  }).then(function() {
    var promise
    var cacheKey = step.href + JSON.stringify(reqRes)
    var cached = cache[cacheKey]
    if (cached) {
      promise = Promise.resolve({body: cached})
    } else {
      promise = doReq(step, reqRes).then(function(response) {
        cache[cacheKey] = response.body
        return response
      })
    }

    return promise.then(function(response) {
      step.response = response.body
      step.endTime = new Date()
      return got.put(processUri, {
        json: true,
        body: {
          data: step,
          links: []
        }
      }).then(function() {
        return executeProcess(steps, response.body, baseUri, parentProcessId)
      })
    }).catch(function(err) {
      step.error = err
      throw err
    })
  })
}

function doReq(step, reqRes) {
  return got.post(step.href, {
    json: true,
    body: reqRes,
    timeout: step.maxExecutionTime || 5000
  })
}

module.exports = app
