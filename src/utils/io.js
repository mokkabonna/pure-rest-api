const traverse = require('json-schema-traverse')
var pointer = require('json-pointer')
var URI = require('uri-js')
var uuidv4 = require('uuid/v4')
const notEmpty = s => s !== ''

var transformers = {
  number: function(val) {
    return parseFloat(val)
  },
  integer: function(val) {
    return parseInt(val, 10)
  }
}

function parse(url, parser) {
  traverse(parser.schema, function(schema, point, _, __, keyword, ____, prop) {
    if (!point)
      return
    var transformer = transformers[schema.transform]
    var propPointer = point.replace(/properties|items/g, '').split('//').join('/')
    var hasProp = pointer.has(url, propPointer)
    if (transformer && hasProp) {
      pointer.set(url, propPointer, transformer(pointer.get(url, propPointer)))
    }
  })
  return url
}

function createIOObject(req, res) {
  var io = {
    i: createRequestObject(req),
    o: createResponseObject(res)
  }

  return io
}

function createResponseObject(res) {
  return {}
}

function createRequestObject(req, parsers = [], ajv) {
  var request = Object.create(null)

    var hostPort = req.headers.host.split(':')
      var host = hostPort[0]
        var port = hostPort[1] ? parseInt(hostPort[1]) : null

        var pathQuery = req.url.split('?')
        var path = pathQuery[0]
        var query = pathQuery[1]

          var url = {
              scheme: 'http',
              host: host.split('.').reverse(),
              port: port,
              path: path.slice(1).split('/').filter(notEmpty),
              query: query || {}
            }

            var components = {
                scheme: 'http',
                host: host,
                port: port
              }

              url.base = URI.serialize(components).replace(/\/$/, '')
              components.path = path,
              components.query = query

              url.complete = URI.serialize(components)

              request.headers = req.headers
              request.operation = {
                method: req.method,
                url
              }

              request.body = req.body

              return request
            }

            module.exports = {
              parse: createRequestObject,
              createIOObject
            }
