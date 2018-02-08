'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var jsonpatch = require('json-patch')
const app = express()

var fakeStore = {
  '/': {
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: 'application/vnd.tbd.collection+json'
    },
    data: {},
    links: [{
      rel: 'self',
      href: '/'
    }, {
      rel: 'item',
      title: 'All JSON schemas',
      href: '/schemas'
    }, {
      rel: 'describedBy',
      href: '/schemas/'
    }]
  },
  '/schemas': {
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: 'application/vnd.tbd.collection+json'
    },
    data: {},
    links: [{
      rel: 'self',
      href: '/schemas'
    }, {
      rel: 'item',
      title: 'Root schema',
      href: '/schemas/'
    }]
  },
  '/schemas/': createResource('/schemas/', {
    $id: 'https://schema.example.com/schemas/',
    $schema: 'http://json-schema.org/draft-07/hyper-schema#',
    base: '',
    links: [{
      rel: 'self',
      href: '',
      submissionSchema: {
        properties: {
          schema: {
            type: 'object'
          }
        }
      }
    }, {
      rel: 'item',
      href: 'schemas'
    }]
  })
}
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

function createResource(uri, data, links) {
  links = links || [{
    rel: 'self',
    href: uri
  }]

  return {
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: 'application/vnd.tbd+json'
    },
    data: data,
    links: links
  }
}

app.use(bodyParser.json({
  type: [
    'application/json-patch+json',
    'application/json',
    'application/vnd.tbd+json',
    'application/vnd.tbd.data+json'
  ]
}))

app.get('*', function(req, res) {
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

app.put('*', function(req, res) {
  var hasResource = store.has(req.originalUrl)
  if (req.headers['content-type'] === 'application/vnd.tbd+json') {
    var resource = createResource(req.originalUrl, req.body.data, req.body.links)
  } else {
    var resource = createResource(req.originalUrl, req.body)
  }

  store.set(req.originalUrl, resource)
  if (hasResource) {
    res.status(204).send()
  } else {
    res.status(201).send(resource)
  }
})

app.patch('*', function(req, res) {
  var hasResource = store.has(req.originalUrl)
  var resource = store.get(req.originalUrl)

  if (hasResource && resource !== undefined) {
    jsonpatch.apply(resource, req.body)
    store.set(req.originalUrl, resource)
    res.status(200).send(resource)
  } else {
    res.status(404).send()
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

module.exports = app
