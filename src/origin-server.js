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
  set(key, val) {
    fakeStore[key] = val
  },
  clear(key) {
    fakeStore[key] = undefined
  }
}

function createResource(uri, data) {
  return {
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: 'application/vnd.tbd+json'
    },
    data: data,
    links: [
      {
        rel: 'self',
        href: uri
      }
    ]
  }
}

app.use(bodyParser.json({
  type: ['application/json-patch+json', 'application/json']
}))

app.get('*', function (req, res) {
  if (req.originalUrl === '/') {
    res.send(store.getAll())
    return
  }

  var resource = store.get(req.originalUrl)
  var hasResource = store.has(req.originalUrl)
  if (hasResource && resource !== undefined) {
    res.set('content-type', resource.meta.contentType)
    res.send(resource)
  } else if (hasResource && resource === undefined) {
    res.status(410).send()
  } else {
    res.status(404).send()
  }
})

app.put('*', function (req, res) {
  var hasResource = store.has(req.originalUrl)
  var resource = createResource(req.originalUrl, req.body)
  store.set(req.originalUrl, resource)
  if (hasResource) {
    res.status(204).send()
  } else {
    res.status(201).send(resource)
  }
})

app.patch('*', function (req, res) {
  var hasResource = store.has(req.originalUrl)
  var resource = store.get(req.originalUrl)

  if (hasResource && resource !== undefined) {
    console.log(req.body)
    jsonpatch.apply(resource, req.body)
    store.set(req.originalUrl, resource)
    res.status(200).send(resource)
  } else {
    res.status(404).send()
  }
})

app.delete('*', function (req, res) {
  var resource = store.get(req.originalUrl)
  var hasResource = store.has(req.originalUrl)
  store.clear(req.originalUrl)
  if (hasResource && resource !== undefined) {
    res.send(resource)
  } else {
    res.status(204).send()
  }
})

module.exports = app
