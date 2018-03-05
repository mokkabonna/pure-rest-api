'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const jsonpatch = require('json-patch')
const URI = require('uri-js')
const LinkHeader = require('http-link-header')
const Ajv = require('ajv')
const _ = require('lodash')
const IO = require('./utils/io')
const uriTemplates = require('uri-templates')
const formatLink = require('format-link-header')
const app = express()

const ajv = new Ajv()
const fakeStore = {}
const dictionary = {}

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
    const existing = fakeStore[key] || []
    var obj
    const sameVariant = existing.find(storeItem => {
      var h = storeItem.headers
      return h['content-type'] === contentType
    })

    if (sameVariant) {
      sameVariant.data = val
      obj = sameVariant
    } else {
      obj = {
        headers: {
          'content-type': contentType || 'application/octet-stream'
        },
        data: val
      }
      existing.push(obj)
    }

    if (linkHeader) {
      obj.headers.link = linkHeader
    }

    fakeStore[key] = existing
  },
  clear(key) {
    fakeStore[key] = undefined
  }
}

function matchesPattern(pattern, uri) {
  if (!pattern) {
    return false
  }
  return new RegExp(pattern).test(uri)
}

app.use(bodyParser.json({
  limit: '5mb',
  type: ['application/json-patch+json', 'application/json', 'application/vnd.tbd+json', 'application/vnd.tbd.data+json']
}))

app.get('*', function(req, res, next) {
  if (req.url === '/*') {
    res.send(store.getAllKeys().map(k => req.protocol + '://' + req.get('host') + '/' + encodeURIComponent(k)))
  } else {
    next()
  }
})

app.get('*', function(req, res) {
  var decodedUrl = decodeURIComponent(req.originalUrl.slice(1))
  var input = {
    method: 'GET',
    uri: IO.parseUri(decodedUrl)
  }

  var resource = store.get(decodedUrl)
  var hasResource = store.has(decodedUrl)
  if (hasResource && resource !== undefined) {
    _.forEach(resource.headers, function(header, name) {
      res.set(name, header)
    })
    res.set('cache-control', 'immutable')

    const definitions = _.pickBy(dictionary, d => ajv.validate(d.describes, input))
    const links = _.flatten(_.map(definitions, (d, uri) => {
      //TODO I link to the whole dictionary now, I should maybe link to the schema only
      return [
        {
          rel: 'describedBy',
          href: uri,
          title: "A description of this resource"
        }
      ]
    }))

    // TODO investigate resolve best practices, here I force all urls to be "directories"
    // https://cdivilly.wordpress.com/2014/03/11/why-trailing-slashes-on-uris-are-important/
    var linkHeader = links.reduce(function(all, link) {
      all[link.rel] = link
      link.url = link.href
      delete link.href
      return all
    }, {})

    res.set('link', formatLink(linkHeader))
    res.send(resource.data)
  } else if (hasResource && resource === undefined) {
    res.status(410).send()
  } else {
    res.status(404).send()
  }
})

const hasKeys = obj => Object.keys(obj).length > 0

var dictionaryItem = {
  "describes": {
    required: ['uri'],
    "properties": {
      "uri": {
        required: ['path'],
        "properties": {
          "path": {
            "minItems": 3,
            "items": [
              {
                "const": "system"
              }, {
                "const": "dictionary"
              },
              true,
              false
            ]
          }
        }
      }
    }
  },
  "description": {
    "required": [
      "describes", "schema"
    ],
    "links": [
      {
        "rel": "collection",
        "href": "/system/dictionary"
      }
    ]
  }
}

var systemConfiguration = {
  required: ['systemPath'],
  properties: {
    systemPath: {
      type: 'string'
    }
  }
}

// configure new domain
app.post('/config/:domain', function(req, res) {
  if (!ajv.validate(systemConfiguration, req.body)) {
    res.status(400).send('Invalid system configuration.')
    return
  }

  dictionaryItem.describes.properties.uri.properties.path.items[0].const = req.body.systemPath
  res.send()
})

app.put('/:uri', function(req, res) {
  const decodedUrl = decodeURIComponent(req.params.uri)
  const hasResource = store.has(decodedUrl)
  const resource = req.body

  var io = {
    method: 'PUT',
    uri: IO.parseUri(decodedUrl)
  }
  const definitions = _.pickBy(dictionary, d => ajv.validate(d.describes, io))

  if (!hasKeys(definitions)) {
    var isDictionaryItem = ajv.validate(dictionaryItem.describes, io)
    if (!isDictionaryItem) {
      res.status(400).send('This resource have no description.')
      return
    }
  }

  if (req.headers['if-none-match'] === '*' && hasResource) {
    res.status(412).send()
  } else if (hasResource) {
    store.set(decodedUrl, resource, req.headers['content-type'], req.headers.link)
    res.status(204).send()
  } else {
    if (isDictionaryItem) {
      console.log(resource)
      dictionary[decodedUrl] = resource
    }
    store.set(decodedUrl, resource, req.headers['content-type'], req.headers.link)
    res.status(201).send(resource)
  }
})

app.delete('*', function(req, res) {
  const decodedUrl = decodeURIComponent(req.originalUrl.slice(1))
  const resource = store.get(decodedUrl)
  const hasResource = store.has(decodedUrl)
  store.clear(decodedUrl)
  if (hasResource && resource !== undefined) {
    res.send(resource)
  } else {
    res.status(204).send()
  }
})

module.exports = app
