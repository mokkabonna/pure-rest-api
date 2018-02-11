'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')

const app = express()

app.use(bodyParser.json())


app.get('/', function(req, res) {
  res.send('I resolve root URIs and replace them with absolute URIs based on the domain name.')
})

app.post('/', function(req, res) {
  var links = req.body.response.body.links
  if (links && links.length) {
    links.forEach(function(link) {
      if (link.href[0] === '/') {
        link.href = req.body.request.operation.url.base + link.href
      }
    })
  }

  res.send(req.body)
})

module.exports = app
