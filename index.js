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
  steps: [
    {
      targetDuration: 100,
      uri: 'http://localhost:3001' // initiator and terminator
    },
    {
      targetDuration: 100,
      uri: 'http://localhost:3001' // initiator and terminator
    }
  ]
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
  console.log('Math operator listening on port 3001!')
  started = started + 1
  if (started === all)
    resolvePromise()
})

var publicUrl = 'http://localhost:' + port

allStarted.then(function() {
  got(publicUrl).then(function(res) {
    console.log(res.body)
  })
})
