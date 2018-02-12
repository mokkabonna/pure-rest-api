'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')

const app = express()

app.use(bodyParser.json())


var linkExpander = {
  data: {
    title: 'Root link expander',
    description: 'I resolve root URIs and replace them with absolute URIs based on the domain name.',
  },
  links: [{
    rel: 'self',
    href: '/self-link-adder'
  }]
}

var selfLink = {
  data: {
    title: 'Self link adder',
    description: 'I add self links to resources that does not have them explicitly set.',
  },
  links: [{
    rel: 'self',
    href: '/links-expander'
  }]
}

app.get('/', function(req, res) {
  res.send({
    items: [linkExpander, selfLink]
  })
})

app.get('/self-link-adder', function(req, res) {
  res.send(selfLink)
})

app.post('/self-link-adder', function(req, res) {
  var body = req.body.response.body
  if (body && body.links && body.links.length) {
    var selfLinks = body.links.filter(l => /(^|\s)self(\s|$)/.test(l.rel))
    if (!selfLinks.length) {
      body.links.push({
        rel: 'self',
        href: req.body.request.operation.url.complete
      })
    }
  }

  res.send(req.body)
})

app.get('/links-expander', function(req, res) {
  res.send(linkExpander)
})

app.post('/links-expander', function(req, res) {
  var body = req.body.response.body
  if (body && body.links && body.links.length) {
    body.links.forEach(function(link) {
      if (link.href[0] === '/') {
        link.href = req.body.request.operation.url.base + link.href
      }
    })
  }

  res.send(req.body)
})

module.exports = app
