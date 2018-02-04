'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var _ = require('lodash')
var axios = require('axios')
var uriTemplates = require('uri-templates')
var pug = require('pug')

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

var clientCache = {}

function createClient(req) {
  var base = req.protocol + '://' + req.get('host')
  return {
    get(url) {
      return axios.get(base + url)
    }
  }
}





// negotion layer
// The recipient of the entity MUST NOT ignore any Content-* (e.g. Content-Range) headers that it does not understand or implement and MUST return a 501 (Not Implemented) response in such cases.

//caching layer
// TODO create a base class for a layer, like an interface
// maybe something like this, for logging purposes
//
//
// {
//   name: 'cache'
//   incoming: {
//     GET: function() {},
//     PUT: function() {}
//   },
//   outgoing: {
//     GET: function() {},
//     PUT: function() {}
//   },
// }
//
//
// etc...

function cacheLayer(req, res, proxyResponse) {
  if (!proxyResponse) {
    if (isGet(req)) {
      var cached = cacheStore[req.path]
      if (cached && cached.headers && req.headers.accept === cached.headers['content-type']) {
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
  return {statusCode: res.statusCode, body: data, headers: res.headers}
}

function wrapRes(req, res, layersSoFar) {
  return newRes
}

function authLayer(req, res, proxyResponse, client) {
  if (!proxyResponse) {
    let auth = req.headers.authenticated
     var url = '/auth' + req.path 
     return client.get(url).then(function (response) {
        if (!auth && response.data) {
         res.status(401).send() 
        } else {
         
        }
      }).catch(function (err) {
        if(err.response.status === 404){
          return 
        }else {
          throw err
        }
      })
    
  } else {
    
  }
}


var resFunctions = ['location', 'set', 'setHeader', 'status']

app.use(bodyParser.json())

var authStore = {
  '/users': {
    GET: ['https://some.com/user/test']
  }
}

app.get('/auth(/*)', function(req, res) {
  var rules = authStore[req.params[0]]
  if(!rules) {
    res.status(404).send()
  } else {
    res.send(rules)
  }
})

var mediaTypeHandlers = []

function mediaTypeLayer(req, res, proxyResponse) {
  if(proxyResponse) {
    var handler = mediaTypeHandlers.find(function(handler) {
      return handler.template.test(req.path)
    })
    
    req.method
    if(handler && isGet(req)) {
      var result = handler.code(proxyResponse.body, pug)
      console.log(result, proxyResponse)
    }
  }
}

app.post('/media-types', function(req, res) {
  
  req.body.template = uriTemplates(req.body.urlTemplate)
  req.body.code = new Function('data', 'resources', req.body.code)
  mediaTypeHandlers.push(req.body)
  res.status(201).send(req.body)
})

// Main controller
app.use(function(req, res) {
  
  var layers = [cacheLayer]
  var returnLayers = layers.slice(0)

  var sendCalled
  var returned
  var client = createClient(req)
  
  var currentPromise = Promise.resolve()

  layers.forEach(function(layer, i) {
    if (sendCalled)
      return
    var send = res.send
    res.send = function(data) {
      sendCalled = true
      layers.slice(0, i).reverse().forEach(function(layer) {
        layer(req, undefined, buildFakeResponse(res, data), client)
      })
      return send.call(res, data)
    }

    layer(req, res, null, client)
    
  })

})

module.exports = app
