'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const jsonpatch = require('json-patch')
const LinkHeader = require('http-link-header')
const _ = require('lodash')
const app = express()

const fakeStore = {}

const store = {
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
  set(key, val, contentType, linkHeader) {
    var obj = {
      headers: {
        'content-type': contentType || 'application/octet-stream',
      },
      data: val
    }

    if (linkHeader) {
      obj.headers.link = linkHeader
    }

    fakeStore[key] = obj
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
  console.log(req.originalUrl)
  var resource = store.get(req.originalUrl)
  var hasResource = store.has(req.originalUrl)
  if (hasResource && resource !== undefined) {
    _.forEach(resource.headers, function(header, name) {
      res.set(name, header)
    })
    res.set('cache-control', 'immutable')
    res.send(resource.data)
  } else if (hasResource && resource === undefined) {
    res.status(410).send()
  } else {
    res.status(404).send()
  }
})

app.put('*', function(req, res) {
  // console.log(decodeURIComponent(req.originalUrl.slice(1)))
  // console.log('http://martinhansen.io:3100' + req.originalUrl)
  var hasResource = store.has(req.originalUrl)
  var resource = req.body

  if (req.headers['if-none-match'] === '*' && hasResource) {
    res.status(412).send()
  } else if (hasResource) {
    store.set(req.originalUrl, resource, req.headers['content-type'], req.headers.link)
    res.status(204).send()
  } else {
    store.set(req.originalUrl, resource, req.headers['content-type'], req.headers.link)
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
