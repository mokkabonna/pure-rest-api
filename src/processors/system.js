'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')
var got = require('got')
var _ = require('lodash')
const Problem = require('api-problem')

const app = express()
app.use(bodyParser.json({limit: '5mb'}))

app.post('/system-handler', function(req, res) {
  handleSystemCall(req.body).then(function(io) {
    res.send(io)
  }).catch(function(e) {
    res.status(500).send(e)
  })
})

function handleSystemCall(io) {
  return new Promise(function(resolve, reject) {
    resolve(io)
  })
}

module.exports = app
