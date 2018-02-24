'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var jsonpatch = require('json-patch')
const app = express()

var fakeStore = {}

var store = {
  has(key) {
    return fakeStore.hasOwnProperty(key)
  },
  get(key) {
    return fakeStore[key]
  },
  getAll() {
    return fakeStore
  },
  getAllKeys() {
    return Object.keys(fakeStore)
  },
  set(key, val, contentType) {
    fakeStore[key] = {
      meta: {
        contentType: contentType || 'application/octet-stream'
      },
      data: val || {
        data: null,
        links: []
      }
    }
  },
  clear(key) {
    fakeStore[key] = undefined
  }
}

app.use(bodyParser.json({
  limit: '5mb',
  type: ['application/json-patch+json', 'application/json', 'application/vnd.tbd+json', 'application/vnd.tbd.data+json']
}))

app.get('*', function(req, res, next) {
  if (req.url === '/*') {
    res.send(store.getAllKeys().map(k => req.protocol + '://' + req.get('host') + k))
  } else {
    next()
  }
})

app.get('*', function(req, res) {
  var resource = store.get(req.originalUrl)
  var hasResource = store.has(req.originalUrl)
  if (hasResource && resource !== undefined) {
    res.set('content-type', resource.meta.contentType)
    res.set('expires', new Date(2018, 4, 1))
    res.send(resource.data)
  } else if (hasResource && resource === undefined) {
    res.status(410).send()
  } else {
    res.status(404).send()
  }
})

app.put('*', function(req, res) {
  console.log(req.originalUrl)
  var hasResource = store.has(req.originalUrl)
  var resource = req.body

  if (req.headers['if-none-match'] === '*' && hasResource) {
    res.status(412).send()
  } else if (hasResource) {
    store.set(req.originalUrl, resource, req.headers['content-type'])
    res.status(204).send()
  } else {
    store.set(req.originalUrl, resource, req.headers['content-type'])
    res.status(201).send(resource)
  }
})

app.delete('*', function(req, res) {
  var resource = store.get(req.originalUrl)
  var hasResource = store.has(req.originalUrl)
  store.clear(req.originalUrl)
  if (hasResource && resource !== undefined) {
    res.send(resource)
  } else {
    res.status(204).send()
  }
})

app.listen(3100, function() {
  console.log('store port @3100')
})
