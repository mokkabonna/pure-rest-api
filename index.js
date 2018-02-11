var origin = require('./src/origin-server')
var httpManager = require('./src/http-manager')
var router = require('./src/router')
var got = require('got')
var fs = require('fs')
var axios = require('axios')
var _ = require('lodash')

var all = 3
var started = 0

var resolvePromise
var allStarted = new Promise(function(resolve, reject) {
  resolvePromise = resolve
})

origin.listen(3100, () => {
  console.log('Persist server listening on port 3100!')
  started = started + 1
  if (started === all) resolvePromise()
})
router.listen(3000, () => {
  console.log('Router listening on port 3000!')
  started = started + 1
  if (started === all) resolvePromise()
})
httpManager.listen(3050, () => {
  console.log('Router listening on port 3050!')
  started = started + 1
  if (started === all) resolvePromise()
})


var base = 'http://localhost:3100'

var resources = {
  '/18e91663-290f-4eeb-967f-32e2c7224123': {
    data: {
      routes: [{
        title: 'Generic fallback GET',
        schema: {
          properties: {
            method: {
              const: 'GET'
            }
          }
        },
        proxy: {
          target: 'http://localhost:3100',
        }
      }]
    },
    links: [],
  },
  '/templates/1': {
    data: '"' + fs.readFileSync('./views/generic.pug', 'utf-8') + '"',
    links: []
  },
  '/18e91663-290f-4eeb-967f-32e2c7224b52': {
    data: {
      parsers: [{
        schema: {
          required: ['path'],
          properties: {
            path: {
              items: [{
                const: 'products'
              }, {
                pattern: '/d+',
                transform: 'number'
              }]
            }
          }
        }
      }],
      routes: [{
        schema: {
          properties: {
            method: {
              const: 'GET'
            },
            path: {
              minItems: 1,
              maxItems: 2,
              items: [{
                const: 'products'
              }, {
                type: 'integer',
                minimum: 1
              }]
            }
          }
        },
        providers: [{
          mediaTypes: ['text/html'],
          target: 'http://localhost:3050'
        }]
      }]
    },
    links: [],
  },
  '/products/1': {
    data: {
      name: 'White shoes'
    },
    links: []
  },
  '/': {
    data: {},
    links: [{
      rel: 'self',
      href: '/'
    }, {
      rel: 'item',
      title: 'All JSON schemas',
      href: '/schemas'
    }, {
      rel: 'describedBy',
      title: 'The root schema',
      href: '/schemas/'
    }]
  },
  '/schemas': {
    data: {},
    links: [{
      rel: 'self',
      href: '/schemas'
    }, {
      rel: 'item',
      title: 'Root schema',
      href: '/schemas/'
    }]
  },
  '/schemas/': {
    data: {
      links: [{
        rel: 'self',
        href: '',
        submissionSchema: {
          title: 'Resource',
          properties: {
            isCollection: {
              type: 'boolean',
              default: false
            },
            schema: {
              title: 'The JSON schema',
              description: 'A JSON schema defining the resource and its structure.',
              type: 'object'
            }
          }
        }
      }, {
        rel: 'item',
        href: 'schemas'
      }]
    },
    links: [{
      rel: 'self',
      href: '/schemas/'
    }, {
      rel: 'collection',
      href: '/schemas'
    }]
  },
}


allStarted.then(function() {
  var prefill = _.map(resources, function(resource, url) {
    return got.put(base + url, {
      json: true,
      body: resource
    })
  })
  return Promise.all(prefill).then(function() {
    return Promise.all([
      configureRouter(),
      configureProcessManager()
    ])
  })
}).then(function() {
  console.log('All services running and configured!')
}).catch(function(err) {
  console.log('Failed to start all services.')
  console.log(err.message)
})


function configureProcessManager() {
  return got.get('http://localhost:3050', {
    headers: {
      accept: 'text/javascript'
    }
  }).then(function(response) {
    //safely create the client code
    var client = new Function('post', response.body).call(null, axios.post)

    return client.post({
      configURL: 'http://localhost:3100/18e91663-290f-4eeb-967f-32e2c7224123'
    }).then(function(res) {
      console.log('Router configured!')
    })
  })
}

function configureRouter() {
  return got.get('http://localhost:3000', {
    headers: {
      accept: 'text/javascript'
    }
  }).then(function(response) {
    //safely create the client code
    var client = new Function('post', response.body).call(null, axios.post)

    return client.post({
      configURL: 'http://localhost:3100/18e91663-290f-4eeb-967f-32e2c7224b52'
    }).then(function(res) {
      console.log('Router configured!')
    })
  })
}
