const processManager = require('./src/process-manager')
const links = require('./src/processors/links')
const system = require('./src/processors/system')
const got = require('./src/got')
const util = require('util')
const fs = require('fs')
const glob = require('glob')
const chalk = require('chalk')
const streamToPromise = require('stream-to-promise')
const Parser = require('stream-json/Parser')
const parser = new Parser()

const globPromise = util.promisify(glob)

var all = 3
var started = 0

var resolvePromise
var allStarted = new Promise(function(resolve, reject) {
  resolvePromise = resolve
})

var port = process.env.PORT || 80
processManager({manages: 'martinhansen.io', systemPath: 'system', mountedAt: 'c:\\users\\marti\\pure-rest-api\\data', persistURI: 'file:///localhost/c:/users/marti/pure-rest-api/data'}).then(function(manager) {
  return manager.server.listen(port, () => {
    console.log('Server listening on port 80!')
    started = started + 1
    if (started === all)
      resolvePromise()
  })
})

links.listen(3003, () => {
  started = started + 1
  if (started === all)
    resolvePromise()
})

system.listen(3001, () => {
  started = started + 1
  if (started === all)
    resolvePromise()
})

var publicUrl = 'http://martinhansen.io'

var statusCodeColors = {
  200: 'green'
}

function getChalk(code) {
  if (code >= 200 && code < 300) {
    return chalk.green
  } else if (code >= 400 && code < 500) {
    return chalk.yellow
  } else if (code >= 500 && code < 600) {
    return chalk.red
  } else {
    return chalk.white
  }
}

allStarted.then(function() {
  return globPromise('kernel/**/*.json', {nodir: true}).then(function(jsonFiles) {
    return Promise.all([...jsonFiles.map(f => {
        const subPath = /kernel\/([^.]+)/.exec(f)[1]
        var uri = publicUrl + '/system/' + subPath
        var stream = fs.createReadStream(f)

        return streamToPromise(stream).then(function(content) {
          return got.put(uri, {body: content}).then(function(response) {
            var code = getChalk(response.statusCode)(response.statusCode)
            console.log(`${code} PUT ${uri}`)
          })
        })
      })])
  })
// }).then(function(response) {
  // return Promise.all(Array.from(new Array(10)).map(function() {
  //   return got('http://martinhansen.io')
  // }))
  // return response
}).then(function() {
  console.log('___Server filled___')
}).catch(function(err) {
  console.log('Could not start servers.')
  console.log(err.response.body)
})
