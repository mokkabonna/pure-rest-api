'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var jsonpatch = require('json-patch')
const app = express()

var fakeStore = {
  '/18e91663-290f-4eeb-967f-32e2c7224b52': {
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: 'application/vnd.tbd+json'
    },
    data: {
      parsers: [{
        schema: {
          required: ['path'],
          properties: {
            path: {
              items: [{
                const: 'products'
              }, {
                pattern: '/d+',
                transform: 'number'
              }]
            }
          }
        }
      }],
      routes: [{
        target: 'http://localhost:3000',
        schema: {
          required: ['path'],
          properties: {
            path: {
              minItems: 2,
              items: [{
                const: 'products'
              }, {
                type: 'integer',
                minimum: 1
              }]
            }
          }
        }
      }, {
        target: 'http://localhost:3000',
        schema: true
      }]
    },
    links: [],
  },
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
      title: 'The root schema',
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
    base: '',
    links: [{
      rel: 'self',
      href: '',
      submissionSchema: {
        title: 'Resource',
        properties: {
          isCollection: {
            type: 'boolean',
            default: false
          },
          schema: {
            title: 'The JSON schema',
            description: 'A JSON schema defining the resource and its structure.',
            type: 'object'
          }
        }
      }
    }, {
      rel: 'item',
      href: 'schemas'
    }]
  }, [{
    rel: 'self',
    href: '/schemas/'
  }, {
    rel: 'collection',
    href: '/schemas'
  }])
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

function createResource(uri, data, links, contentType) {
  contentType = contentType || 'application/vnd.tbd+json'
  links = links || [{
    rel: 'self',
    href: uri
  }]

  return {
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: contentType
    },
    data: data,
    links: links
  }
}

app.use(bodyParser.json({
  type: ['application/json-patch+json', 'application/json', 'application/vnd.tbd+json', 'application/vnd.tbd.data+json']
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
    var resource = createResource(req.originalUrl, req.body.data, req.body.links, req.body.meta.contentType)
  } else {
    var resource = createResource(req.originalUrl, req.body)
  }

  if (req.headers['if-none-match'] === '*' && hasResource) {
    res.status(412).send()
  } else if (hasResource) {
    store.set(req.originalUrl, resource)
    res.status(204).send()
  } else {
    store.set(req.originalUrl, resource)
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
