'use strict'
var express = require('express')
var bodyParser = require('body-parser')
const app = express()
const http = require('http')
const axios = require('axios')
const CacheableRequest = require('cacheable-request')
var httpProxy = require('http-proxy')
var typeis = require('type-is')
var accepts = require('accepts')

app.set('view engine', 'pug')
const cacheableRequest = new CacheableRequest(http.request)

var proxy = httpProxy.createProxyServer();
var self = l => l.rel === 'self'
var isItem = l => l.rel === 'item'
var isDescribedBy = l => l.rel === 'describedBy'


app.use(express.static('public'))

app.use(bodyParser.json({
  type: [
    'application/json-patch+json',
    'application/json',
    'application/vnd.tbd+json',
    'application/vnd.tbd.data+json'
  ]
}))

app.get('*', function(req, res) {
  var accept = accepts(req)
  var acceptType = accept.type(['html'])

  if (acceptType === 'html') {
    axios.get('http://127.0.0.1:3001' + req.originalUrl).then(function(response) {
      var describedBy = response.data.links.find(isDescribedBy)
      if (describedBy) {
        return axios.get('http://127.0.0.1:3001' + describedBy.href).then(function(describedRes) {
          var items = response.data.links.filter(isItem).map(l => l.href)
          res.render('generic', {
            resource: response.data,
            isCollection: !!items.length,
            describedBy: describedRes.data,
            items: items,
            uri: response.data.links.find(self)
          })
        })
      } else {
        var items = response.data.links.filter(isItem).map(l => l.href)
        res.render('generic', {
          resource: response.data,
          isCollection: !!items.length,
          describedBy: null,
          items: items,
          uri: response.data.links.find(self)
        })
      }
    }).catch(function(err) {
      if (err.response && err.response.status === 404) {
        res.render('404')
      } else {
        res.render('500')
      }
    })
  } else {
    proxy.web(req, res, {
      target: 'http://127.0.0.1:3001'
    });
  }
})


app.post('*', function(req, res) {
  var url = 'http://127.0.0.1:3001' + req.originalUrl

  // TODO: add json schema validation
  if (!req.body.schema) {
    res.status(400).send({
      'message': 'Not valid json schema'
    })
    return
  }

  axios.get(url).then(function(response) {
    if (response.data.meta.contentType === 'application/vnd.tbd.collection+json') {
      var length = response.data.links.filter(isItem).length
      var itemUrl = req.path === '/' ? req.originalUrl + length : req.originalUrl + '/' + length
      return Promise.all([
        axios({
          method: 'PUT',
          url: url + '/' + length,
          headers: {
            'content-type': 'application/vnd.tbd+json'
          },
          data: {
            data: {},
            links: [
              {
                rel: 'self',
                href: '/' + length
              },
              {
                rel: 'describedBy',
                href: '/schemas/1'
              }
            ]
          }
        }),
        axios({
          method: 'PUT',
          url: url + 'schemas/1',
          headers: {
            'content-type': 'application/vnd.tbd.data+json'
          },
          data: req.body.schema
        }),
        axios({
          method: 'PATCH',
          url: url,
          headers: {
            'content-type': 'application/json-patch+json'
          },
          data: [{
            op: 'add',
            path: '/links/-',
            value: {
              rel: 'item',
              href: itemUrl
            }
          }]
        })
      ]).then(function(values) {
        res.location(itemUrl)
        res.status(201).send(values[0].data)
      })
    }
  })
})

app.use(function(req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:3001'
  });
})

module.exports = app
