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
    if (io.i.isDictionaryCall && io.i.uri.path[2]) {
      io.link('http://martinhansen.io/dictionary')
    }
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




PUT /system/dictionary/system

PUT /system/links/(http://maha.io/system/dictionary/system)/(http://maha.io/system/dictionary)/item
PUT /system/links/(http://maha.io/system/dictionary/system)/(http://maha.io/system/dictionary)/collection
PATCH /system/dictionary/
