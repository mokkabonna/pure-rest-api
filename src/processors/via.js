'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')
var got = require('../got')

const app = express()

app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.send('I take links with via relation include the content for further processing.')
})

app.post('/', function(req, res) {
  var body = req.body.response.body
  if (body && body.links && body.links.length) {
    var viaLinks = body.links.filter(l => l.rel === 'via')

    Promise.all(viaLinks.map(function(link) {
      var options = {
        json: true
      }

      if (req.body.request.headers['x-correlation-id']) {
        options.headers = {
          'x-correlation-id': req.body.request.headers['x-correlation-id']
        }
      }

      return got(link.href, options).then(function(response) {
        req.body.sources[link.href] = response.body
      })
    })).then(function() {
      res.set('cache-control', 'public')
      res.set('expires', new Date().setMonth(4))
      res.send(req.body)
    }).catch(function(err) {
      res.status(500).send(err)
    })
  } else {
    res.send(req.body)
  }
})

module.exports = app
