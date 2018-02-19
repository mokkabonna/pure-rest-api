'use strict'
var express = require('express')
var bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send('I do basic math operations. Addition, division etc.')
})

app.post('/basic', function(req, res) {
  req.body.o.statusCode = 200
  req.body.o.body = {
    extra:  'Hello world from basic math operations!',
    ...req.body.o.body
  }

  setTimeout(function () {
    res.send(req.body)
  }, 0)
})

module.exports = app
