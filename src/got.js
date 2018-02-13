var got = require('got')
const map = new Map()

function newGot(url, options, ...rest) {
  options = options || {
    json: true,
  }

  options.cache = map

  return got.apply(got, [url, options].concat(rest))
}


function createGot(method) {
  return function newGot(url, options, ...rest) {
    options = options || {
      json: true,
    }
    options.method = method
    options.cache = map

    return got.apply(got, [url, options].concat(rest))
  }
}

newGot.get = createGot('get')
newGot.post = createGot('post')
newGot.put = createGot('put')
newGot.patch = createGot('patch')
newGot.head = createGot('head')
newGot.delete = createGot('delete')


module.exports = newGot
