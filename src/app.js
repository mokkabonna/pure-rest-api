var express = require('express')
var bodyParser = require('body-parser')
var _ = require('lodash')

const app = express()

const cacheStore = {}
const safeVerbs = ['GET', 'HEAD']
const verbs = [
  'OPTIONS',
  'GET',
  'HEAD',
  'PUT',
  'POST',
  'DELETE',
  'PATCH'
]

const idempotentVerbs = ['OPTIONS', 'GET', 'HEAD', 'PUT', 'DELETE']

const invalidatesCacheVerbs = ['PUT', 'POST', 'DELETE', 'PATCH']

const isOptions = req => req.method === 'OPTIONS'
const isGet = req => req.method === 'GET'
const isHead = req => req.method === 'HEAD'
const isPut = req => req.method === 'PUT'
const isPost = req => req.method === 'POST'
const isDelete = req => req.method === 'DELETE'
const isPatch = req => req.method === 'PATCH'
const invalidatesCache = req => invalidatesCacheVerbs.contains(req.method)

//caching layer
function cacheLayer(req, res, proxyResponse) {
  if (!proxyResponse) {
    if (isGet(req)) {
      var cached = cacheStore[req.path]
      if (cached) {
        res.status(200).send(cached.body)
      }
    }
  } else {
    if (isGet(req)) {
      cacheStore[req.path] = proxyResponse
    } else if (isPut(req)) {
      cacheStore[req.path] = buildFakeResponse(proxyResponse, req.body)
    }
  }
}

var fakeStore = {}
function persistLayer(req, res, proxyResponse) {
  if (!proxyResponse) {
    if (fakeStore.hasOwnProperty(req.path)) {
      var resource = fakeStore[req.path]
      if (isGet(req)) {
        res.send(resource)
      } else if (isPost(req)) {
        resource.push(req.body)
        res.location(req.path + '/' + resource.length)
        res.status(201).send(req.body)
      } else if (isPut(req)) {
        res.status(204)
        res.send()
      }
    } else {
      if (isPut(req)) {
        fakeStore[req.path] = req.body
        res.status(201)
        res.send()
      } else {
        res.status(404).send()
      }
    }
  }
}

function buildFakeResponse(res, data) {
  return {statusCode: res.statusCode, body: data}
}

function wrapRes(req, res, layersSoFar) {

  return newRes
}

app.use(bodyParser.json())

var resFunctions = ['location', 'set', 'setHeader', 'status']

// Main controller
app.use(function(req, res) {
  var layers = [cacheLayer, persistLayer]
  var returnLayers = layers.slice(0)

  var sendCalled
  var returned

  layers.forEach(function(layer, i) {
    if (sendCalled)
      return
    var send = res.send
    res.send = function(data) {
      sendCalled = true
      layers.slice(0, i).reverse().forEach(function(layer) {
        layer(req, undefined, buildFakeResponse(res, data))
      })
      return send.call(res, data)
    }

    layer(req, res)
  })

})

module.exports = app
