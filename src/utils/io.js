const traverse = require('json-schema-traverse')
var pointer = require('json-pointer')
var URI = require('uri-js')
var uuidv4 = require('uuid/v4')

const safeVerbs = ['HEAD', 'GET', 'OPTIONS', 'TRACE']
const idempotentVerbs = safeVerbs.concat(['PUT', 'DELETE'])
const potentiallyCacheableVerbs = ['HEAD', 'GET', 'POST']
const notEmpty = s => s !== ''
const isSafe = method => safeVerbs.indexOf(method) !== -1
const isIdempotent = method => idempotentVerbs.indexOf(method) !== -1
const isPotentiallyCacheable = method => potentiallyCacheableVerbs.indexOf(method) !== -1

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

function createIOObject(req, res, config) {
  var io = {
    i: createRequestObject(req, config),
    o: createResponseObject(res)
  }

  return io
}

function createResponseObject(res) {
  return {headers: {}}
}

function createRequestObject(req, config) {
  var request = Object.create(null)

  var hostPort = req.headers.host.split(':')
  var host = hostPort[0]
  var port = hostPort[1]
    ? parseInt(hostPort[1])
    : null

  var pathQuery = req.url.split('?')
  var path = pathQuery[0]
  var query = pathQuery[1]

  var uri = {
    scheme: 'http',
    host: host.split('.').reverse(),
    port: port || 80,
    path: path.slice(1).split('/'),
    pathString: path,
    queryString: query || ''
  }

  var components = {
    scheme: 'http',
    host: host,
    port: port || 80
  }

  uri.base = URI.serialize(components).replace(/\/$/, '')
  components.path = path
  components.query = query

  uri.complete = URI.serialize(components)

  request.headers = req.headers
  request.method = req.method
  request['is' + req.method] = true
  request.isSystemCall = uri.path[0] === config.systemPath
  request.isDictionaryCall = request.isSystemCall && uri.path[1] === 'dictionary'
  request.isRouteCall = request.isSystemCall && uri.path[1] === 'routes'
  request.isSafe = isSafe(req.method)
  request.isIdempotent = isIdempotent(req.method)
  request.isPotentiallyCacheable = isPotentiallyCacheable(req.method)
  request.uri = uri

  request.body = req.body

  return request
}

module.exports = {
  parse: createRequestObject,
  createIOObject
}
