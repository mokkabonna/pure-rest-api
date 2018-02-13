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

app.get('/links-and-data-splitter', function(req, res) {
  res.send(selfLink)
})

app.post('/links-and-data-splitter', function(req, res) {
  var op = req.body.request.operation
  var body = req.body.request.body

  if (body && body.links && body.data) {
    body.links.push({
      rel: 'via',
      href: op.url.complete + '/data'
    }, {
      rel: 'via',
      href: op.url.complete + '/links'
    })

    return Promise.all([
      got.put(op.url.complete, {
        json: true,
        body: req.body
      }),
      got.put(op.url.complete + '/data', {
        json: true,
        body: body.data
      }),
      got.put(op.url.complete + '/links', {
        json: true,
        body: body.links
      })
    ]).then(function() {
      res.send(req.body)
    }).catch(function(err) {
      res.status(500).send(err)
    })
  }

  res.send(req.body)
})

app.get('/dynamic-link-putter', function(req, res) {
  res.send(selfLink)
})

app.post('/dynamic-link-putter', function(req, res) {
  var operation = req.body.request.operation
  var op = req.body.request.operation

  if (op.url.query.rel && op.url.query.href) {
    Promise.all([got(op.url.complete, {json: true})]).then(function(responses) {
      res.send(req.body.response.body = responses[0].body)
    }).catch(function(err) {
      res.status(500).send(err)
    })
  } else {
    res.send(req.body)
  }
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

})

module.exports = app
