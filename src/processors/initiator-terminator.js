'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const ioUtil = require('../utils/io')
const glob = require('glob')
const util = require('util')
const fs = require('fs')

const readFile = util.promisify(fs.readFile)

const app = express()

app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send('I populate the response body if it exists')
})

app.post('/initiator', function(req, res) {
  var processURI = '/system/processes/' + uuidv4()
  var io = req.body

  io.meta = {
    data: {
      startTime: new Date(),
      endTime: null
    },
    links: [{
      rel: 'self',
      href: processURI
    }, {
      rel: 'collection',
      href: '/system/processes/running'
    }]
  }

  io.o.statusCode = 200
  io.o.body = 'Hello world!'
  res.send(io)
})

app.post('/terminator', function(req, res) {
  var io = req.body
  io.o.statusCode = 200
  io.o.body = 'Hello world!'
  io.meta.data.endTime = new Date().getTime()
  res.send(io)
})

module.exports = app
