'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')
var got = require('got')
var _ = require('lodash')

const app = express()
app.use(bodyParser.json())

var linkExpander = {
  data: {
    title: 'Root link expander',
    description: 'I resolve root URIs and replace them with absolute URIs based on the domain name.'
  },
  links: [
    {
      rel: 'self',
      href: '/self-link-adder'
    }
  ]
}

var selfLink = {
  data: {
    title: 'Self link adder',
    description: 'I add self links to resources that does not have them explicitly set.'
  },
  links: [
    {
      rel: 'self',
      href: '/links-expander'
    }
  ]
}

app.get('/', function(req, res) {
  res.send({
    items: [linkExpander, selfLink]
  })
})

app.get('/hypermedia-enricher', function(req, res) {
  res.send(selfLink)
})

app.post('/hypermedia-enricher', function(req, res) {
  var links = req.body.response.body.links

  var selfLinks = links.filter(l => /(^|\s)self(\s|$)/.test(l.rel))
  if (!selfLinks.length) {
    links.push({rel: 'self', href: req.body.request.operation.url.complete})
  }

  links.forEach(function(link) {
    if (link.href[0] === '/') {
      link.href = req.body.request.operation.url.base + link.href
    }
  })

  var viaLinks = links.filter(l => l.rel === 'via')

  Promise.all(viaLinks.map(function(link) {
    var options = {
      json: true
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

})


app.post('/organizer', function(req, res) {
  var body = req.body.request.body

  res.send(req.body)
})

module.exports = app
