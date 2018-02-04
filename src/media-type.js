'use strict'
var express = require('express')
var bodyParser = require('body-parser')
const app = express()
const http = require('http')
const CacheableRequest = require('cacheable-request')
var httpProxy = require('http-proxy')

const cacheableRequest = new CacheableRequest(http.request)

var proxy = httpProxy.createProxyServer();

app.use(bodyParser.json())

app.post('/media-types', function(req, res) {
  req.body.template = uriTemplates(req.body.urlTemplate)
  req.body.code = new Function('data', 'resources', req.body.code)
  mediaTypeHandlers.push(req.body)
  res.status(201).send(req.body)
  res.send()
})

app.use(function (req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:3331'
  });
})

module.exports = app
