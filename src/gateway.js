'use strict'
var express = require('express')
var bodyParser = require('body-parser')
const app = express()
const http = require('http')
const CacheableRequest = require('cacheable-request')
var httpProxy = require('http-proxy')
 
const cacheableRequest = new CacheableRequest(http.request)

var proxy = httpProxy.createProxyServer();
 
app.use(function (req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:3333'
  });
})

module.exports = app
