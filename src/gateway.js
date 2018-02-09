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
var got = require('got')
var Ajv = require('ajv')
var URI = require('uri-js')
var uriTemplates = require('uri-templates')
var uuidv4 = require('uuid/v4')
var Problem = require('api-problem')
var problemMiddleware = require('api-problem/lib/middleware')

app.set('view engine', 'pug')

var proxy = httpProxy.createProxyServer();
var relSelf = l => l.rel === 'self'
var relItem = l => l.rel === 'item'
var relDescribedBy = l => l.rel === 'describedBy'
var isCollection = resource => resource.meta.contentType === 'application/vnd.tbd.collection+json'

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

  if (req.path === '/') {
    res.set('expires', '-1')
  }

  if (acceptType === 'html') {
    axios.get('http://127.0.0.1:3001' + req.originalUrl).then(function(response) {
      var describedBy = response.data.links.find(relDescribedBy)
      console.log(describedBy)
      if (describedBy) {
        return axios.get('http://127.0.0.1:3001' + describedBy.href).then(function(describedRes) {
          var items = response.data.links.filter(relItem).map(l => l.href)
          res.render('generic', {
            resource: response.data,
            isCollection: isCollection(response.data),
            describedBy: describedRes.data,
            items: items,
            uri: response.data.links.find(relSelf)
          })
        })
      } else {
        var items = response.data.links.filter(relItem).map(l => l.href)
        res.render('generic', {
          resource: response.data,
          isCollection: isCollection(response.data),
          describedBy: null,
          items: items,
          uri: response.data.links.find(relSelf)
        })
      }
    }).catch(function(err) {
      if (err.response && err.response.status === 404) {
        res.render('404')
      } else {
        console.log(err)
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
  var parentUrl = 'http://127.0.0.1:3001' + req.originalUrl
  var schema = req.body.schema

  // TEMP
  schema = {
    "$id": "/schemas/products",
    "type": "object",
    "required": ["items"],
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "$id": "/schemas/product",
          "links": [{
            "rel": "item",
            "href": "products{/id}",
            "templateRequired": ["id"]
          }]
        }
      }
    },
    "links": [{
      "rel": "self",
      "href": "products",
      "targetSchema": {
        "$ref": "#"
      },
      "submissionSchema": {
        "title": "Create product",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "price": {
            "type": "number",
            "minimum": 0
          }
        }
      }
    }]
  }

  got(parentUrl, {
    json: true
  }).then(function(response) {
    var describedByRel = response.body.links.find(relDescribedBy)

    if (!describedByRel) {
      new Problem(405, 'This resource has no defined processing defined.').send(res)
    } else {
      var describedByUrl = URI.resolve(parentUrl, describedByRel.href)

      return got(describedByUrl, {
        json: true
      }).then(function(descResponse) {
        var ajv = new Ajv({
          allErrors: true
        })

        var selfRel = descResponse.body.data.links.find(relSelf)
        var validate = ajv.compile(selfRel.submissionSchema)
        var valid = validate(req.body)
        console.log(valid)
        if (!valid) {
          new Problem(400, {
            detail: validate.errors
          }).send(res)
        } else {


          //fake for now, probably need to store this in the database
          function userCode(representation) {

            return {
              id: 1,
              ...representation
            }
          }

          // TEMP Just like this for now, separating root and the other
          if (req.path !== '/') {
            var itemRel = descResponse.body.data.properties.items.items.links.find(relItem)
            var instanceData = userCode(req.body)

            var template = uriTemplates(itemRel.href)
            var resourceUrlFilled = template.fill(instanceData)
            var fullNewResourceUrl = URI.resolve(parentUrl, resourceUrlFilled)

            console.log(fullNewResourceUrl)

            return Promise.all([
              got.put(fullNewResourceUrl, {
                headers: {
                  'content-type': 'application/vnd.tbd+json',
                  'if-none-match': '*'
                },
                json: true,
                body: {
                  meta: {
                    contentType: 'application/vnd.tbd+json'
                  },
                  data: instanceData,
                  links: [{
                    rel: 'describedBy',
                    href: descResponse.body.data.properties.items.items.$id
                  }]
                }
              })
            ]).then(function(responses) {
              res.location(fullNewResourceUrl)
              res.status(201).send(responses[0].body)
            })

          } else if (isCollection(response.body) && req.path === '/') {
            var selfRel = schema.links.find(relSelf)
            var resourceUrl = URI.resolve(req.path, selfRel.href)
            var fullNewResourceUrl = URI.resolve(parentUrl, selfRel.href)
            var schemaUrl = URI.resolve('/schemas/', selfRel.href)
            var fullSchemaUrl = URI.resolve(parentUrl, schemaUrl)
            schema.$id = schemaUrl

            return Promise.all([
              got.put(fullNewResourceUrl, {
                headers: {
                  'content-type': 'application/vnd.tbd+json',
                  'if-none-match': '*'
                },
                json: true,
                body: {
                  meta: {
                    contentType: 'application/vnd.tbd.collection+json'
                  },
                  data: {},
                  links: [{
                    rel: 'self',
                    href: resourceUrl
                  }, {
                    rel: 'describedBy',
                    href: schemaUrl
                  }]
                }
              }),
              got.put(fullSchemaUrl, {
                headers: {
                  'content-type': 'application/vnd.tbd.data+json'
                },
                json: true,
                body: schema
              }),
              got.patch(parentUrl, {
                headers: {
                  'content-type': 'application/json-patch+json'
                },
                json: true,
                body: [{
                  op: 'add',
                  path: '/links/-',
                  value: {
                    rel: 'item',
                    href: resourceUrl
                  }
                }]
              })
            ]).then(function(responses) {
              res.location(fullNewResourceUrl)
              res.status(201).send(responses[0].body)
            }).catch(function(err) {
              new Problem(500, err.message).send(res)
            })
          } else {
            new Problem(501, 'POSTing to non collection resources is not supported yet.').send(res)
          }
        }
      })
    }

  })
})

app.use(function(req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:3001'
  });
})

app.use(problemMiddleware)

module.exports = app
