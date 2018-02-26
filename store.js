'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const jsonpatch = require('json-patch')
const URI = require('uri-js')
const LinkHeader = require('http-link-header')
const Ajv = require('ajv')
const _ = require('lodash')
const IO = require('./src/utils/io')
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
    var obj = {
      headers: {
        'content-type': contentType || 'application/octet-stream'
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

    const definitions = _.pickBy(dictionary, d => ajv.validate(d.noun, input))
    const links = _.compact(_.flatten(_.map(definitions, (d, uri) => {
      //TODO I link to the whole dictionary now, I should maybe link to the schema only
      return [
        {
          rel: 'describedBy',
          href: uri,
          title: "A description of this resource"
        }
      ].concat(d.schema.links)
    })))

    links.forEach(l => l.href = URI.resolve(decodedUrl + '/', l.href))
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

app.put('*', function(req, res) {
  const decodedUrl = decodeURIComponent(req.originalUrl.slice(1))
  var hasResource = store.has(decodedUrl)
  var resource = req.body

  if (req.headers['if-none-match'] === '*' && hasResource) {
    res.status(412).send()
  } else if (hasResource) {
    store.set(decodedUrl, resource, req.headers['content-type'], req.headers.link)
    res.status(204).send()
  } else {
    if (/dictionary\/./.test(decodedUrl)) {
      dictionary[decodedUrl] = resource
    }
    store.set(decodedUrl, resource, req.headers['content-type'], req.headers.link)
    res.status(201).send(resource)
  }
})

app.delete('*', function(req, res) {
  const decodedUrl = decodeURIComponent(req.originalUrl.slice(1))
  var resource = store.get(decodedUrl)
  var hasResource = store.has(decodedUrl)
  store.clear(decodedUrl)
  if (hasResource && resource !== undefined) {
    res.send(resource)
  } else {
    res.status(204).send()
  }
})

app.listen(3100, function() {
  console.log('store port @3100')
})