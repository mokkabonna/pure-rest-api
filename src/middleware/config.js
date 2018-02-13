var fs = require('fs')
var got = require('../got')
var bodyParser = require('body-parser')
var Mustache = require('mustache')
var URI = require('uri-js')
var _ = require('lodash')

function getRequestUrl(req) {
  return req.protocol + '://' + req.get('host') + req.originalUrl
}

module.exports = function(req, res, next) {
  if (req.app.locals.config) {
    next()
  } else {
    if (req.method === 'POST' && req.originalUrl === '/') {
      var middleware = bodyParser.json()
      middleware(req, res, function() {
        if (req.body) {
          req.app.locals.config = req.body
          var components = URI.parse(req.body.configURL)
          req.app.locals.config.persistURL = URI.serialize(_.pick(components, 'scheme', 'userinfo', 'host', 'port'))
          got(req.body.configURL, {
            json: true,
          }).then(function(response) {
            res.status(201).send(req.body)
          }).catch(function(err) {
            // TODO handle invalid config based on json schema
            if (err.response && err.response.statusCode === 404) {
              res.status(400).send('Could not find the router config.')
            } else {
              res.status(500).send(500)
            }
          })
        } else {
          res.status(400).send('Invalid config')
        }
      })
    } else {
      fs.readFile('public/js/config-client.js', 'utf-8', function(err, contents) {
        if (err) {
          res.send(500).send()
        } else {
          res.set('content-type', 'text/javascript')
          res.send(Mustache.render(contents, {
            url: getRequestUrl(req)
          }))
        }
      })
    }
  }
}
