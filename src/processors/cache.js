'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')
var got = require('got')
var _ = require('lodash')

const app = express()

app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send('I cache resources and deliver the cached item.')
})

app.post('/', function(req, res) {
  res.send(req.body)
})

module.exports = app
