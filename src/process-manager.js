const http = require('http')
const got = require('got')
const uuidv4 = require('uuid/v4')
const ioUtil = require('./utils/io')

var store = new Map()
var processStore = new Map()

function createServer(config) {
  config = config || {}
  
  if(!config.steps) {
    throw new Error('You must initialize the server with relevant steps.')
  }
  
  return {
    server: http.createServer(function(request, response) {
      let body = []
      var io = ioUtil.createIOObject(request, response)
      var url = io.i.operation.url.complete
      
      request.on('error', (err) => {
        console.error(err)
      }).on('data', (chunk) => {
        body.push(chunk)
      }).on('end', () => {
        body = Buffer.concat(body).toString()
      
        response.on('error', (err) => {
          console.error(err)
        })
        
        var doRequest = function doRequest(step) {
          got.post(step.uri, {
            json: true,
            body: io
          })
        }
        
        var currentIO = io
        for (let i = 0; i < config.steps.length; i++) {
          currentIO = await doRequest(config.steps[i])
        }
  
        response.writeHead(currentIO.o.statusCode || 200, {
          'X-Powered-By': 'my library!'
        })
        
        response.end(JSON.stringify(currentIO.o.body))
      })
    })
  }
}

module.exports = createServer
