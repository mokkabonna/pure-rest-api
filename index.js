var processManager = require('./src/process-manager')
var math = require('./src/processors/math')
var IT = require('./src/processors/initiator-terminator')
var got = require('got')
var fs = require('fs')

var all = 3
var started = 0

var resolvePromise
var allStarted = new Promise(function(resolve, reject) {
  resolvePromise = resolve
})

var port = process.env.PORT || 80
var manager = processManager({
  manages: 'martinhansen.io',
  mountedAt: 'c:\\users\\marti\\pure-rest-api\\data',
  persistURI: 'file:///localhost/c:/users/marti/pure-rest-api/data',
  beforeEach: [],
  afterEach: [],
  routes: [{
    name: 'Standard get',
    test: {
      properties: {
        method: {
          const: 'GET'
        }
      }
    },
    steps: [{
      uri: 'http://localhost:3002/basic'
    }]
  }]
})

manager.server.listen(port, () => {
  console.log('Server listening on port 80!')
  started = started + 1
  if (started === all)
    resolvePromise()
})

math.listen(3002, () => {
  console.log('Math operator listening on port 3002!')
  started = started + 1
  if (started === all)
    resolvePromise()
})

IT.listen(3001, () => {
  console.log('IO operator listening on port 3001!')
  started = started + 1
  if (started === all)
    resolvePromise()
})

var publicUrl = 'http://localhost:' + port

allStarted.then(function() {
  return got(publicUrl).then(function(res) {
    return got.put(publicUrl + '/')
  })
}).catch(function (err) {
  console.log('Could not start servers.')
  console.log(err.response.body)
})
