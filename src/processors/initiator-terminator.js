'use strict'
var express = require('express')
var bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send('I do basic math operations. Addition, division etc.')
})

app.post('/initiator', function(req, res) {
  req.body.o.statusCode = 200
  req.body.o.body = 'Hello world!'
  res.send(req.body)
})

app.post('/terminator', function(req, res) {
  req.body.o.statusCode = 200
  req.body.o.body = 'Hello world!'
  res.send(req.body)
})

module.exports = app
