const glob = require('glob')
const util = require('util')
const fs = require('fs')
const csv = require('csv')
const _ = require('lodash')

const globPromise = util.promisify(glob)
const readFile = util.promisify(fs.readFile)
const csvUtil = util.promisify(csv.parse)
const handleFile = f => readFile(f, 'utf-8').then(csvUtil.parse).then(c => console.log(c))

// const writeFile = util.promisify(fs.writeFile)

function csvConverter(io) {
  globPromise('*.csv').then(convertAllCsvFilesToJson).then(function(results) {

  }).catch(catchAllHandler)
}

function convertAllCsvFilesToJson(files) {
  return Promise.all(files.map(f => csvConverter).map(handleFile))
}

function catchAllHandler(err) {
  console.error('An operational error occured. See the next lines for a detailed error information:')
  console.error(err)
}
//
// const head = function service(io) {
//   return {
//     get: {
//       csvFiles: globPromise.bind(null, '*.csv')
//     },
//     post: {
//       csvConverter: csvConverter.bind(null, io)
//     }
//   }
// }

function createLink(rel, href) {
  var link = {
    rel,
    href
  }

  link['relIs' + rel[0].toUpperCase() + rel.slice(1)] = true
  return link
}

var selfLinkHandler = {
  get(target, key) {
    var val = target[key]
    if (val && val.links && val.links.length) {
      var hasSelf = val.links.find(link => link.relationIsSelf)
      if (!hasSelf) {
        val.links.push(createLink('self', key))
      }
    }
  }
}


class RootServer {
  constructor(options) {
    this.mountedAt = options.mountedAt
    this.isRoot = !!options.mountedAt
    this._rep = {}
    this._links = {}
  }
  get rep() {
    return new Proxy(this._rep, selfLinkHandler)
  }
  mount(path, Server) {
    var server = new Server({
      mountedAt: this.mountedAt + '\\' + path
    })
    this[path] = {
      get: server
    }
  }
}

function createCollection(io) {
  io.o.body.data = {
    items: io.o.body.links
  }

  return io
}

function selfLinkAdder(io) {
  var links = io.i && io.i.links
  if (links && links.length) {
    var hasSelf = links.find(link => link.relIsSelf)
    if (!hasSelf) {
      links.push(createLink('self', 'some uri'))
    }
  }
  return io
}

function createIO(method) {
  var io = {
    i: {
      method: method.toUpperCase(),
      headers: {},
      params: {}
    },
    o: {}
  }

  io.i.get = path => _.get(io.i.body, path)
  io.o.get = path => _.get(io.o.body, path)

  return io
}

// dataserver because it operates on the data folder
class DataServer {
  constructor(options) {
    this.mountedAt = options.mountedAt
    this.isRoot = !!options.mountedAt

    
    var routes = [{
      test: function(io) {
        return io.i.method === 'GET'
      },
      // experimental thoughts: Identity and access management code that runs inbetween each process and verifies each output and input
      // so that no processor does things it's not allowed to do, if it does so it will be flagged as a misbehaving service and an replacement will be located
      // the process will be stopped until a replacement has been found, or the original operator behaves according to spec. 
      // When this happens we can respond with 202 for http and in js with a promise containing a representation!
      iam: iam,
      operators: [{
        run: selfLinkAdder
      }, {
        test: function(io) {
          return !!io.o.get('links.length')
        },
        run: createCollection
      }]
    }]

    var proxy = new Proxy(this, {
      get(target, key) {
        var originValue = target[key]
        if (typeof originValue === 'function') {
          var io = createIO('GET')
          var route = routes.find(r => r.test(io))
          if (route) {
            return async function() {
              // get the original resource and populate the body
              io.o.body = await originValue.call(target, io) 
              var processors = route.processors.filter(p => _.attempt(p.test, io) === true)

              // sequentially do the operations
              // if the future we can 
              for (var i = 0; i < processors.length; i++) {
                io = await processors[i].run(io)
              }
              
              //For PUT, POST, PATCH then io.i.body is persisted according to the cache rules
              
              return io
            }
          } else {
            return Promise.reject(new Error('Method not allowed. or something..'))
          }
        } else {
          return target[key]
        }
      }
    })

    return proxy
  }
  files(io) {
    var globPattern = this.mountedAt + '/**' + (io.i.params.type ? '.' + io.i.params.type : '')
    return globPromise(globPattern).then(fileURIs => {
      return {
        data: null,
        links: fileURIs.map(href => createLink('item', href))
      }
    })
  }
}

async function convertCsvToJSON(options) {
  var head = new RootServer(options)
  head.mount('datasets', DataServer)
  var io = await head.datasets.get.files({
    type: 'csv'
  })

  console.log(io.o)
}

convertCsvToJSON({
  mountedAt: 'c:\\users\\martinha\\plotting-demo'
}).then(function(result) {
  console.log(result)
}).catch(function(err) {
  console.log(err)
  console.log('program error')
})
