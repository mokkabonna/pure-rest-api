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
  var links = req.body.response.body.links
  var response = req.body.response

  var itemLinks = links.filter(function(link) {
    var relationTypes = link.rel.split(' ').map(s => s.trim())
    return relationTypes.indexOf('item') !== -1
  })

  if (itemLinks.length) {
    _.merge(response.body.data, {
      items: _.compact(itemLinks.map(l => sources[l.href]))
    })
  }

  res.send(req.body)

})

module.exports = app
