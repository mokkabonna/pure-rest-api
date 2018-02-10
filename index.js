var origin = require('./src/origin-server')
var gateway = require('./src/gateway')
var validation = require('./src/validation')
var router = require('./src/router')

origin.listen(3100, () => console.log('Persist server listening on port 3100!'))
validation.listen(3001, () => console.log('Gateway listening on port 3001!'))
router.listen(3002, () => console.log('Router listening on port 3002!'))
gateway.listen(process.env.PORT || 3000, () => console.log('Gateway listening on port 3000!'))
