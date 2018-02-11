const traverse = require('json-schema-traverse')
var pointer = require('json-pointer')
var URI = require('uri-js')

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
    if (!point) return
    var transformer = transformers[schema.transform]
    var propPointer = point.replace(/properties|items/g, '').split('//').join('/')
    var hasProp = pointer.has(url, propPointer)
    if (transformer && hasProp) {
      pointer.set(url, propPointer, transformer(pointer.get(url, propPointer)))
    }
  })
  return url
}

const notEmpty = s => s !== ''


module.exports = {
  parse: function createRequestObject(req, parsers = [], ajv) {
    var request = Object.create(null)

    var hostPort = req.get('host').split(':')
    var host = hostPort[0]
    var port = hostPort[1]

    var url = {
      scheme: req.protocol,
      host: host.split('.').reverse(),
      port: parseInt(port),
      path: req.path.slice(1).split('/').filter(notEmpty),
      query: req.query
    }

    var components = {
      scheme: req.protocol,
      host: host,
      port: parseInt(port),
    }

    url.base = URI.serialize(components).replace(/\/$/, '')
    components.path = req.path,
    components.query = req.originalUrl.split('?')[1]

    url.complete = URI.serialize(components)
    url.originalUrl = req.originalUrl

    request.headers = req.headers
    request.operation = {
      method: req.method,
      url
    }

    var parsers = parsers.filter(function(parser) {
      return ajv.validate(parser.schema, request.operation)
    })

    request.operation = parsers.reduce(parse, request.operation)

    return request
  }
}
