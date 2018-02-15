'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')
var got = require('got')
var _ = require('lodash')

const app = express()

app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send('I take links with via relation include the content for further processing.')
})

app.post('/', function(req, res) {
  req.body.response.statusCode = 200
  req.body.response.body = 'Hello world!'
  res.send(req.body)
})

module.exports = app
