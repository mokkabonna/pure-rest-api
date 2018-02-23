'use strict'
var express = require('express')
var bodyParser = require('body-parser')
var URI = require('uri-js')
var got = require('got')
var _ = require('lodash')

const app = express()
app.use(bodyParser.json({
  limit: '1mb'
}))

var linkExpander = {
  data: {
    title: 'Root link expander',
    description: 'I resolve root URIs and replace them with absolute URIs based on the domain name.'
  },
  links: [
  {
    rel: 'self',
    href: '/self-link-adder'
  }]
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
  }]
}

app.get('/', function(req, res) {
  res.send({
    items: [linkExpander, selfLink]
  })
})

app.post('/uri-normalizer', function(req, res) {
  redirectToNormalized(req.body)
  res.send(req.body)
})

function redirectToNormalized(io) {
  if (io.i.uri.path.some(p => p === '')) {
    io.o.statusCode = 302
    io.o.headers.location = URI.normalize(io.i.uri.base + io.i.uri.pathString.replace(/[/]$/, '') + io.i.uri.queryString)
  }
}

app.get('/hypermedia-enricher', function(req, res) {
  res.send(selfLink)
})

app.post('/hypermedia-enricher', function(req, res) {
  hyperAllTheThings(req.body).then(function() {
    res.send(req.body)
  }).catch(function(err) {
    res.status(500).send()
  })
})

function hyperAllTheThings(io) {
  var links = io.o.body.links
  var viaLinks = links.filter(l => l.rel === 'via')

  return Promise.all(viaLinks.map(function(link) {
    var options = {
      json: true
    }
    return got(link.href, options).then(function(response) {
      io.sources[link.href] = response.body
    })
  })).then(function() {
    var selfLinks = links.filter(l => /(^|\s)self(\s|$)/.test(l.rel))
    if (!selfLinks.length) {
      links.push({
        rel: 'self',
        href: io.i.uri.complete.replace(/[/]$/, ''),
        title: 'This resource'
      })
    }

    links.forEach(function(link) {
      //treat trailing slashes same as without
      if (link.href[0] === '/') {
        link.href = (io.i.uri.base + link.href).replace(/[/]$/, '')
      } else if (link.href.slice(0, 3) === '../') {
        link.href = URI.resolve(io.i.uri.complete + '/', link.href).replace(/[/]$/, '')
      } else if (link.href.slice(0, 2) === './') {
        link.href = URI.resolve(io.i.uri.complete + '/', link.href).replace(/[/]$/, '')
      }
    })
  })
}




module.exports = app
