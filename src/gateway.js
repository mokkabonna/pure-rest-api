'use strict'
var express = require('express')
var bodyParser = require('body-parser')
const app = express()
const http = require('http')
const axios = require('axios')
const CacheableRequest = require('cacheable-request')
var httpProxy = require('http-proxy')
var typeis = require('type-is')
var accepts = require('accepts')

app.set('view engine', 'pug')
const cacheableRequest = new CacheableRequest(http.request)

var proxy = httpProxy.createProxyServer();
var self = l => l.rel === 'self'

app.use(express.static('public'))

app.get('/', function(req, res, next) {
  var accept = accepts(req)
  var acceptType = accept.type(['html'])

  if (acceptType === 'html') {
    axios.get('http://127.0.0.1:3100').then(function(response) {
      res.render('index', {resources: response.data})
    })
  } else {
    proxy.web(req, res, {target: 'http://127.0.0.1:3100'});
  }
})

app.get('*', function(req, res) {
  var accept = accepts(req)
  var acceptType = accept.type(['html'])

  if (acceptType === 'html') {
    axios.get('http://127.0.0.1:3100' + req.originalUrl).then(function(response) {
      res.render('generic', {
        resource: response.data,
        uri: response.data.links.find(self)
      })
    }).catch(function(err) {
      if (err.response.status === 404) {
        res.render('404')
      } else {
        res.render('500')
      }
    })
  } else {
    proxy.web(req, res, {target: 'http://127.0.0.1:3100'});
  }
})

app.use(function(req, res) {
  proxy.web(req, res, {target: 'http://127.0.0.1:3100'});
})

module.exports = app
