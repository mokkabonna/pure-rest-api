'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')
var got = require('got')

const app = express()

app.use(bodyParser.json())


app.get('/', function(req, res) {
  res.send('I take links with via relation include the content for further processing.')
})

app.post('/', function(req, res) {

  var body = req.body.response.body
  if (body && body.links && body.links.length) {
    var viaLinks = body.links.filter(function(link) {
      var relationTypes = link.rel.split(' ').map(s => s.trim())
      return relationTypes.indexOf('via') !== -1
    })

    Promise.all(viaLinks.map(function(link) {
      return got(link.href, {
        json: true
      }).then(function(response) {
        req.body.sources[link.href] = response.body
      })
    })).then(function() {
      res.send(req.body)
    }).catch(function(err) {
      res.status(500).send(err)
    })
  }
})

module.exports = app
