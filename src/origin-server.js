'use strict'
var express = require('express')
var bodyParser = require('body-parser')
const app = express()

var fakeStore = {}
var store = {
  has(key) {
    return fakeStore.hasOwnProperty(key)
  },
  get(key) {
    return fakeStore[key]
  },
  set(key, val) {
    fakeStore[key] = val
  },
  clear(key) {
    fakeStore[key] = undefined
  }
}

app.use(bodyParser.text({
  type: '*/*'
}))

app.get('*', function (req, res) {
  console.log(req.headers)
  var resource = store.get(req.originalUrl)
  var hasResource = store.has(req.originalUrl)
  if (hasResource && resource !== undefined) {
    res.send(resource)
  } else if (hasResource && resource === undefined) {
    res.status(410).send()
  } else {
    res.status(404).send()
  }
})

app.put('*', function (req, res) {
  var hasResource = store.has(req.originalUrl)
  store.set(req.originalUrl, req.body)
  if (hasResource) {
    res.status(204).send()
  } else {
    res.status(201).send() 
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
