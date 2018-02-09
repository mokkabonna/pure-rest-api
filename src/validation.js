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

// const productsSchema = require('./schemas/products.')
// const productSchema = require('./schemas/product.schema.json')
// const idschema = require('./schemas/shared/id.schema.json')
//
// schema.addSchema(productsSchema.$id, {
//   properties: {
//     body: productsSchema
//   }
// })
// schema.addSchema(productSchema.$id, productSchema)
// schema.addSchema(idschema.$id, idschema)
//
//
// var schemas = [productsSchema, productSchema]
// var vf = expressAjv.validatorFactory
//
// app.use(function(req, res, next) {
//
//   var matching = schemas.find(s => {
//     var selfLink = s.links.find(isSelf)
//     if (selfLink && selfLink.href === req.path.slice(1)) {
//       return true
//     }
//   })
//
//   // validate if matching found
//   if (matching) {
//     vf(matching.$id)(req, res, next)
//   } else {
//     next()
//   }
// })

app.use(function(req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:3100'
  })
})

module.exports = app
