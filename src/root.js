const http = require('http')
const got = require('got')
const uuidv4 = require('uuid/v4')
const initiator = require('./processors/initiator')
const terminator = require('./processors/terminator')

var requestCache = new Map()
var store = new Map()
var processes = []

function createServer(port, initConfig) {
  var uri = `http://${initConfig.token}.localhost:` + port
  var serverConfig = {}
  return {
    uri: uri,
    server: http.createServer(function(request, response) {
      const {headers, method, url} = request
      let body = []

      var transaction = {
        request: {
          method,
          url,
          headers
        },
        response: {}
      }

      var hasStored = store.has(url)
      var cached = store.get(url)

      if (cached) {
        transaction.response.body = cached
      }

      if (serverConfig) {}

      request.on('error', (err) => {
        console.error(err)
      }).on('data', (chunk) => {
        body.push(chunk)
      }).on('end', () => {
        transaction.body = store.set(url, transaction)
        body = Buffer.concat(body).toString()

        response.on('error', (err) => {
          console.error(err)
        })

        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json')

        const responseBody = {
          headers,
          method,
          url,
          body
        }

        response.write(JSON.stringify(responseBody))
        response.end()
      })
    }).listen(port, function() {
      if (initConfig.parent) {
        console.log('Child process started at ' + port)
      } else {
        console.log('Root process started at' + port)
      }
    })
  }
}

var root = createServer(3001, {
  parent: null,
  token: uuidv4(),
  initiatorURI: 'http://localhost:3020',
  terminatorURI: 'http://localhost:3030'
})

got.post(root.uri, {
  json: true,
  body: {
    processor: {
      uri: 'uri'
    }
  }
}).then(function() {
  return got.get(root.uri)
}).catch(function(err) {
  console.log(err)
})
