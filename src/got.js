var got = require('got')
var cache = require('./cache')

function newGot(url, options, ...rest) {
  options = options || {
    json: true,
  }

  options.cache = cache

  return got.apply(got, [url, options].concat(rest))
}


function createGot(method) {
  return function newGot(url, options, ...rest) {
    options = options || {
      json: true,
    }
    options.method = method
    options.cache = cache

    return got.apply(got, [url, options].concat(rest))
  }
}

function createGotStream(method) {
  return function newGot(url, options, ...rest) {
    options = options || {}
    options.method = method
    options.headers = {
      'content-type': 'application/json'
    }
    options.cache = cache

    return got.stream[method].apply(got, [url, options].concat(rest))
  }
}

newGot.get = createGot('get')
newGot.post = createGot('post')
newGot.put = createGot('put')
newGot.patch = createGot('patch')
newGot.head = createGot('head')
newGot.delete = createGot('delete')

newGot.stream = {
  get: createGotStream('get'),
  post: createGotStream('post'),
  put: createGotStream('put'),
  patch: createGotStream('patch'),
  head: createGotStream('head'),
  delete: createGotStream('delete'),
}


module.exports = newGot
