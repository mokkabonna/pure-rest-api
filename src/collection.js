'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var axios = require('axios')
const app = express()
var httpProxy = require('http-proxy')
var uriTemplates = require('uri-templates')

var proxy = httpProxy.createProxyServer();
var base = 'http://127.0.0.1:3340'
var collectionsUrl = base + '/collections'

app.use(bodyParser.json())

app.post('/collections', function(req, res) {
  var template = uriTemplates(req.body.url)
  var collectionBase = template.fill({})
  var collectionUrl = base + collectionBase
  axios.get(collectionsUrl).then(function(response) {
    return response.data
  }).catch(function(err) {
    if (err.response.status === 404) {
      return []
    } else {
      throw err
    }
  }).then(function(collections) {
    collections.push({
      url: req.body.url,
    })

    axios.put(collectionsUrl + collectionUrl, collections).then(function(response) {
      res.location(collectionUrl)
      res.status(201).send(response.data)
    })
  })
})

app.post('*', function(req, res) {
  axios.get(collectionsUrl).then(function(response) {
    var collectionConfig = response.data.find(function(handler) {
      var template = uriTemplates(handler.url)
      return template.test(req.originalUrl)
    })

    if (collectionConfig) {

    }
  })
})

app.use(function(req, res) {
  proxy.web(req, res, {target: 'http://127.0.0.1:3340'});
})

module.exports = app
