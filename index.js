var origin = require('./src/origin-server')
var gateway = require('./src/gateway')

origin.listen(3100, () => console.log('Persist server listening on port 3100!'))
gateway.listen(3000, () => console.log('Gateway listening on port 3000!'))
