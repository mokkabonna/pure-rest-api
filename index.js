var origin = require('./src/origin-server')
var httpManager = require('./src/http-manager')
var links = require('./src/processors/links')
var standardCollection = require('./src/processors/standard-collection')
var via = require('./src/processors/via')
var cache = require('./src/processors/cache')
var router = require('./src/router')
var got = require('got')
var fs = require('fs')
var axios = require('axios')
var _ = require('lodash')

var all = 6
var started = 0

var resolvePromise
var allStarted = new Promise(function(resolve, reject) {
  resolvePromise = resolve
})

origin.listen(3100, () => {
  console.log('Persist server listening on port 3100!')
  started = started + 1
  if (started === all)
    resolvePromise()
})
router.listen(process.env.PORT || 3000, () => {
  console.log('Router listening on port 3000!')
  started = started + 1
  if (started === all)
    resolvePromise()
})
httpManager.listen(3050, () => {
  started = started + 1
  if (started === all)
    resolvePromise()
})
links.listen(3051, () => {
  started = started + 1
  if (started === all)
    resolvePromise()
})
via.listen(3052, () => {
  started = started + 1
  if (started === all)
    resolvePromise()
})
standardCollection.listen(3053, () => {
  started = started + 1
  if (started === all)
    resolvePromise()
})
cache.listen(3010, () => {
  started = started + 1
  if (started === all)
    resolvePromise()
})

var base = 'http://localhost:3100'

var resources = {
  '/processes/all': {
    data: {
      id: 'root',
      startTime: new Date()
    },
    links: [
      {
        rel: 'item',
        href: 'http://localhost:3100/processes/all/1'
      }
    ]
  },
  '/processes': {
    data: {
      routes: [
        {
          title: 'Generic collection representation',
          schema: {
            properties: {
              method: {
                const: 'GET'
              }
            }
          },
          steps: [
            {
              href: 'http://localhost:3051/hypermedia-enricher',
              testSchema: {
                properties: {
                  response: {
                    required: ['body'],
                    properties: {
                      body: {
                        type: 'object',
                        properties: {
                          links: {
                            type: 'array',
                            minItems: 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }, {
          title: 'Organizer',
          schema: {
            properties: {
              method: {
                const: 'PUT'
              }
            }
          },
          steps: [
            {
              testSchema: true,
              href: 'http://localhost:3051/organizer'
            }
          ]
        }
      ]
    },
    links: []
  },
  '/templates/1': {
    data: '"' + fs.readFileSync('./views/generic.pug', 'utf-8') + '"',
    links: []
  },
  '/18e91663-290f-4eeb-967f-32e2c7224b52': {
    data: {
      parsers: [],
      routes: [
        {
          schema: {
            properties: {
              method: {
                const: 'GET'
              },
              path: {
                minItems: 1,
                maxItems: 2,
                items: [
                  {
                    const: 'products'
                  }, {
                    type: 'integer',
                    minimum: 1
                  }
                ]
              }
            }
          },
          providers: [
            {
              mediaTypes: ['text/html'],
              target: 'http://localhost:3050'
            }
          ]
        }
      ]
    },
    links: []
  },
  '/products/1': {
    data: {
      name: 'White shoes'
    },
    links: []
  },
  '/': {
    data: {},
    links: [
      {
        rel: 'item',
        title: 'All JSON schemas',
        href: '/schemas'
      }, {
        rel: 'item',
        title: 'Process information',
        href: '/processes/all'
      }, {
        rel: 'describedBy',
        title: 'The root schema',
        href: '/schemas/root'
      }
    ]
  },
  '/schemas': {
    data: {},
    links: [
      {
        rel: 'via',
        title: 'Root schema',
        href: '/schemas/root'
      }, {
        rel: 'item',
        title: 'Root schema',
        href: '/schemas/root'
      }
    ]
  },
  '/schemas/root': {
    data: {
      links: [
        {
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
        }
      ]
    },
    links: [
      {
        rel: 'collection',
        href: '/schemas'
      }
    ]
  }
}

var publicUrl = 'http://localhost:' + (
process.env.PORT || 3000)

for (var i = 0; i < 5; i++) {
  resources['/schemas'].links.push({rel: 'via', href: '/schemas/root'})
  resources['/schemas'].links.push({rel: 'item', href: '/schemas/root'})
}

allStarted.then(function() {
  var prefill = _.map(resources, function(resource, url) {
    return got.put(base + url, {
      json: true,
      body: resource
    })
  })
  return Promise.all(prefill).then(function() {
    return Promise.all([configureRouter(), configureProcessManager()])
  })
}).then(function() {
  console.log('All services running and configured!')

  Promise.all([
    got.get(publicUrl),
    got.get(publicUrl + '/processes', {json: true})
  ]).catch(function(err) {
    console.log('test of resources failed')
    console.log(err)
  })
}).catch(function(err) {
  console.log('Failed to start all services.')
  console.log(err.message)
});

function configureProcessManager() {
  return got.get('http://localhost:3050', {
    headers: {
      accept: 'text/javascript'
    }
  }).then(function(response) {
    //safely create the client code
    var client = new Function('post', response.body).call(null, axios.post)

    return client.post({configURL: 'http://localhost:3100/processes'}).then(function(res) {
      console.log('Router configured!')
    })
  })
}

function configureRouter() {
  return got.get(publicUrl, {
    headers: {
      accept: 'text/javascript'
    }
  }).then(function(response) {
    //safely create the client code
    var client = new Function('post', response.body).call(null, axios.post)

    return client.post({configURL: 'http://localhost:3050/18e91663-290f-4eeb-967f-32e2c7224b52'}).then(function(res) {
      console.log('Router configured!')
    })
  })
}
