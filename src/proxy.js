const http = require('http')
const httpProxy = require('http-proxy')

var surfingSession = '1'
var proxy = httpProxy.createProxyServer()
var server = http.createServer(function(request, response) {

  var host = 'http://' + request.headers.host

  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.setHeader('X-session-id', surfingSession);
  })

  proxy.on('proxyRes', function(proxyRes, req, res) {
    var body = []

    proxyRes.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()

      var reqRes = {
        req: {
          method: req.method,
          url: req.url,
          headers: req.headers
        },
        res: {
          statusCode: res.statusCode,
          headers: proxyRes.headers,
          body: body,
        }
      }
      console.log(JSON.stringify(reqRes))
    })
  })

  proxy.web(request, response, {target: host})
})

server.listen(8080, function() {
  console.log('HTTP Proxy started on 8080! Surfing session: ' + surfingSession)
})
