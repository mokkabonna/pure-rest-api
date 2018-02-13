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
  var sources = req.body.sources
  var body = req.body.response.body
  var response = req.body.response

  if (body && body.links) {
    var itemLinks = body.links.filter(l => l.rel === 'item')

    if (itemLinks.length) {
      _.merge(response.body, {
        data: {
          items: _.compact(itemLinks.map(l => sources[l.href]))
        }
      })
    }
  }

  res.send(req.body)

})

module.exports = app
