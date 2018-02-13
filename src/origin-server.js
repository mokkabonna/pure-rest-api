'use strict'
const express = require('express')
const fs = require('fs')
const path = require('path')
const util = require('util')
const glob = require('glob')
const bodyParser = require('body-parser')
const jsonpatch = require('json-patch')
const app = express()

const read = util.promisify(fs.readFile)
const write = util.promisify(fs.writeFile)
const globPromise = util.promisify(glob)

var fakeStore = {}

var storage = path.join(__dirname, '../data')

console.log(storage)

var store = {
  has(key) {
    return fakeStore.hasOwnProperty(key)
  },
  get(key) {
    var filePath = path.join(storage, encodeURIComponent(key) + '.json')
    return read(filePath, 'utf-8').then(function(content) {
      return JSON.parse(content)
    }, function() {
      return undefined //not found
    }).catch(function() {
      return null //parse error
    })
  },
  getAllKeys() {
    return globPromise(storage + '/**', {
      nodir: true
    }).then(function(files) {
      return files.map(f => {
        var match = /\/([^/]+)\.json/.exec(f)
        return decodeURIComponent(match[1])
      })
    })
  },
  set(key, val, contentType) {
    var filePath = path.join(storage, encodeURIComponent(key) + '.json')
    return write(filePath, JSON.stringify({
      meta: {
        contentType: contentType || 'application/octet-stream'
      },
      data: val || {
        data: null,
        links: []
      }
    }))
  },
  clear(key) {
    throw new Error('not implemented yet')
    fakeStore[key] = undefined
  }
}

app.use(bodyParser.json({
  type: ['application/json-patch+json', 'application/json', 'application/vnd.tbd+json', 'application/vnd.tbd.data+json']
}))

app.get('*', function(req, res, next) {
  if (req.url === '/*') {
    store.getAllKeys().then(function(files) {
      res.send(files.map(k => req.protocol + '://' + req.get('host') + k))
    }).catch(function(err) {
      console.log(err)
      res.status(500).send(err)
    })
  } else {
    next()
  }
})

app.get('*', function(req, res) {
  store.get(req.originalUrl).then(function(resource) {
    if(resource === undefined) {
      res.status(404).send()
    } else if (resource !== null) {
      res.set('content-type', resource.meta.contentType)
      res.set('expires', new Date(2018, 4, 1))
      res.send(resource.data)
    } else {
      res.status(410).send()
    }
  }).catch(function(err) {
    if (err.code === 'ENOENT') {
    } else {
      res.status(500).send('Storage get error')
    }
  })
})

app.put('*', function(req, res) {
  var resource = req.body

  store.get(req.originalUrl).then(function(existingResource) {
    var hasResource = existingResource !== null
    if (req.headers['if-none-match'] === '*' && hasResource) {
      res.status(412).send()
    } else if (hasResource) {
      store.set(req.originalUrl, resource, req.headers['content-type']).then(function() {
        res.status(204).send()
      }).catch(function() {
        res.status(500).send('Storage error PUT')
      })
    } else {
      store.set(req.originalUrl, resource, req.headers['content-type']).then(function() {
        res.status(201).send(resource)
      }).catch(function() {
        res.status(500).send('Storage error PUT')
      })
    }
  }).catch(function() {
    if (err.code === 'ENOENT') {
      res.status(404).send()
    } else {
      res.status(500).send()
    }
  })
})

// app.patch('*', function(req, res) {
//   var hasResource = store.has(req.originalUrl)
//   var resource = store.get(req.originalUrl)
//
//   if (hasResource && resource !== undefined) {
//     jsonpatch.apply(resource, req.body)
//     store.set(req.originalUrl, resource)
//     res.status(200).send(resource)
//   } else {
//     res.status(404).send()
//   }
// })

app.delete('*', function(req, res) {
  var hasResource = store.has(req.originalUrl)
  store.clear(req.originalUrl).then(function(resource) {
    if (hasResource && resource !== undefined) {
      res.send(resource)
    } else {
      res.status(204).send()
    }
  })
})

module.exports = app
