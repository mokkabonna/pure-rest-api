const traverse = require('json-schema-traverse')
var pointer = require('json-pointer')
var _ = require('lodash')
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
    startTime: new Date(),
    endTime: null,
    minTargetDuration: 1,
    maxTargetDuration: 1,
    stages: [],
    i: createRequestObject(req, config),
    o: createResponseObject(res)
  }

  var second = new Date().toISOString().replace(/\.\d\d\dZ$/, '').replace(/[^\d]/g, '/')
  io.selfLink = io.i.uri.base + `/${config.systemPath}/processes/${second}/${_.uniqueId()}`

  return io
}

function createResponseObject(res) {
  return {statusCode: 200, headers: {}}
}

function createFromUrl(url) {
  var parts = URI.parse(url)

  var uri = {
    ...parts
  }

  uri.host = uri.host.split('.').reverse()
  uri.pathString = uri.path
  uri.port = uri.port || 80
  uri.path = uri.path.slice(1).split('/')
  uri.queryString = uri.query

  delete uri.query
  delete uri.userinfo

  return uri
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
  request.isSafe = isSafe(req.method) || undefined //remove if false
  request.isIdempotent = isIdempotent(req.method) || undefined //remove if false
  request.isPotentiallyCacheable = isPotentiallyCacheable(req.method) || undefined
  request.uri = uri

  request.body = req.body

  return request
}

module.exports = {
  parseUri: createFromUrl,
  createIOObject
}
