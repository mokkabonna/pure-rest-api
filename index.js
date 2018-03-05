const processManager = require('./src/process-manager')
const math = require('./src/processors/math')
const links = require('./src/processors/links')
const IT = require('./src/processors/initiator-terminator')
const got = require('./src/got')
const util = require('util')
const fs = require('fs')
const glob = require('glob')
const streamToPromise = require('stream-to-promise')
const Parser = require('stream-json/Parser')
const parser = new Parser()

const globPromise = util.promisify(glob)

var all = 4
var started = 0

var resolvePromise
var allStarted = new Promise(function(resolve, reject) {
  resolvePromise = resolve
})

var port = process.env.PORT || 80
processManager({manages: 'martinhansen.io', systemPath: 'system'}).then(function(manager) {
  return manager.server.listen(port, () => {
    console.log('Server listening on port 80!')
    started = started + 1
    if (started === all)
      resolvePromise()
  })
}).catch(function(err) {
  console.log(err)
  console.log(err.response.body)
})

math.listen(3002, () => {
  console.log('Math operator listening on port 3002!')
  started = started + 1
  if (started === all)
    resolvePromise()
})

links.listen(3003, () => {
  console.log('Links operator listening on port 3003!')
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

var publicUrl = 'http://martinhansen.io'

allStarted.then(function() {
  return globPromise('kernel/**/*.json', {nodir: true}).then(function(jsonFiles) {
    return Promise.all([...jsonFiles.map(f => {
        const subPath = /kernel\/([^.]+)/.exec(f)[1]
        var content = fs.readFileSync(f, 'utf8')
        return got.put(publicUrl + '/system/' + subPath, {
          headers: {
            'content-type': 'application/json',
          },
          body: content
        })
      })])
  })
}).then(function() {
  console.time('stress-test')
  // return Promise.all(Array.from(new Array(10)).map(function() {
  //   return got('http://martinhansen.io')
  // }))
}).then(function() {
  console.timeEnd('stress-test')
  console.log('___Server filled___')
}).catch(function(err) {
  console.log('Could not start servers.')
  console.log(err)
  console.log(err.response && err.response.body)
})
