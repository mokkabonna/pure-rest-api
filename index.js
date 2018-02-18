var processManager = require('./src/process-manager')
var math = require('./src/processors/math')
var got = require('got')
var fs = require('fs')

var all = 2
var started = 0

var resolvePromise
var allStarted = new Promise(function(resolve, reject) {
  resolvePromise = resolve
})

var manager = processManager()
manager.server.listen(80, () => {
  console.log('Server listening on port 80!')
  started = started + 1
  if (started === all)
    resolvePromise()
})
math.listen(3001, () => {
  console.log('Math operator listening on port 3001!')
  started = started + 1
  if (started === all)
    resolvePromise()
})

var publicUrl = 'http://localhost:80'

allStarted.then(function() {
  got('http://localhost:80').then(function(res) {
    console.log(res.body)
  })
})
