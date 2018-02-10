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
var proxy = httpProxy.createProxyServer()
var isSelf = l => l.rel === 'self'
var isItem = l => l.rel === 'item'

const expressAjv = require('express-ajv')
const schema = expressAjv.schema

app.use(function(req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:3100'
  })
})

module.exports = app
