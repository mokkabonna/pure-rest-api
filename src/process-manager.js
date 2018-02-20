const http = require('http')
const got = require('got')
const fs = require('fs')
const path = require('path')
const util = require('util')
const uuidv4 = require('uuid/v4')
const Ajv = require('ajv')
const ioUtil = require('./utils/io')
const Keyv = require('keyv')



const readFile = util.promisify(fs.readFile)

var processStore = new Map()
var ajv = new Ajv()


function createClient(mountedAt) {
  return {
    get: function(uri, mediaType, language) {
      return new Promise(function(resolve, reject) {
        var fileUri = path.join(mountedAt, uri.scheme, String(uri.port), uri.host.join('/'), '_root', uri.path.join('/'))
        readFile(fileUri).then(resolve, reject)
      })
    }
  }
}


function createServer(config) {
  config = config || {}

  if (!config.routes) throw new Error('You must initialize the server with relevant steps.')
  const store = new Keyv()
  const dictionary = new Keyv()
  const relationships = new Keyv()

  store.set('http://' + config.manages + '/system', {
    title: 'System manager'
  })

  store.set('http://' + config.manages + '/system/processes', {
    title: 'Process overview'
  })

  return {
    server: http.createServer(async function(request, response) {
      let body = []
      var io = ioUtil.createIOObject(request, response)
      var url = io.i.uri.complete



      request.on('error', (err) => {
        console.error(err)
      }).on('data', (chunk) => {
        body.push(chunk)
      }).on('end', async() => {
        body = Buffer.concat(body).toString()
        io.i.body = body

        console.log(body)

        var result = {
          body: io
        }

        try {
          var route = config.routes.find(r => {
            return ajv.validate(r.test, io.i.uri)
          })

          var allSteps = config.beforeEach.concat(route.steps).concat(config.afterEach)
          io.o.body = await store.get(io.i.uri.complete)


          var processCollection = io.i.uri.base + '/system/processes/' + new Date()
          var processUri = processCollection + '/' + uuidv4()

          var processInfo = {
            data: {
              startTime: new Date(),
              endTime: null,
              steps: []
            },
            links: [{
              rel: 'self',
              href: processUri
            }]
          }

          await store.set(processUri, processInfo)

          for (let i = 0; i < allSteps.length; i++) {
            result = await got.post(allSteps[i].uri, {
              json: true,
              body: result.body
            })
          }

          processInfo.data.endTime = new Date()

          await store.set(processUri, processInfo)

          var output = result.body.o

          response.writeHead(output.statusCode || 200, {
            'X-Powered-By': 'my library!'
          })

          response.end(JSON.stringify(output.body))
        } catch (e) {
          response.writeHead(500, {
            'X-Powered-By': 'my library!'
          })

          response.end('Error: ' + e.message)
        }
      })
    })
  }
}

module.exports = createServer
