const http = require('http')
const got = require('got')
const uuidv4 = require('uuid/v4')
const ioUtil = require('./utils/io')

var store = new Map()
var processStore = new Map()

function createServer(config) {
  config = config || {}
  return {
    server: http.createServer(function(request, response) {
      let body = []
      var io = ioUtil.createIOObject(request, response)
      var url = io.i.operation.url.complete

      response.write(JSON.stringify(io))
      request.pipe(response)

      // request.on('error', (err) => {
      //   console.error(err)
      // }).on('data', (chunk) => {
      //   body.push(chunk)
      // }).on('end', () => {
      //   io.body = store.set(url, io)
      //   body = Buffer.concat(body).toString()
      //
      //   response.on('error', (err) => {
      //     console.error(err)
      //   })
      //
      //   response.statusCode = 200
      //   response.setHeader('Content-Type', 'application/json')
      //
      //   const responseBody = {
      //     headers: io.i.headers,
      //     method: io.i.operation.method,
      //     url: io.i.operation.url.completeUrl,
      //     body: body,
      //   }
      //
      //   response.write(JSON.stringify(responseBody))
      //   response.end()
      // })
    })
  }
}

module.exports = createServer
