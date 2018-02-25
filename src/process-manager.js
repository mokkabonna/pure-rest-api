const http = require('http')
const got = require('./got')
const fs = require('fs')
const path = require('path')
const util = require('util')
const _ = require('lodash')
const uuidv4 = require('uuid/v4')
const Ajv = require('ajv')
const ioUtil = require('./utils/io')
const Keyv = require('keyv')
const Problem = require('api-problem')
const streamToPromise = require('stream-to-promise')

const readFile = util.promisify(fs.readFile)
const isSchema = val => _.isPlainObject(val) || val === true || val === false
const isJSON = i => /application[/]([^+]+)?json/.test(i.headers['content-type'])
const isJSONSerializable = v => _.isPlainObject(v) || Array.isArray(v) || v === true || v === false || v === null || _.isString(v) || _.isFinite(v)

var processStore = new Map()
var ajv = new Ajv()

async function createServer(config) {
  config = config || {}

  var systemRoute = {
    "title": "System route",
    "test": {
      "properties": {
        "method": {
          "const": "PUT"
        },
        "uri": {
          "properties": {
            "path": {
              "minItems": 1,
              "items": [
                {
                  "const": config.systemPath
                }
              ]
            }
          }
        }
      }
    },
    "steps": [
      {
        targetDuration: 0,
        uri: 'http://localhost:3001/system-handler'
      }, {
        "targetDuration": 10,
        "uri": "http://localhost:3003/hypermedia-enricher"
      }
    ]
  }

  var storeUri = 'http://martinhansen.io:3100'

  const store = {
    get: function(uri) {
      console.log(uri)
      return got.stream.get(storeUri + '/' + encodeURIComponent(uri)).on('error', function(e) {
        console.log(e)
      })
    },
    put: function(uri, data) {
      if (isJSONSerializable(data)) {
        data = JSON.stringify(data)
      }
      return got.stream.put(storeUri + '/' + encodeURIComponent(uri), {body: data}).on('error', function(e) {
        console.log(e)
      })
    }
  }

  store.get.json = function(uri) {
    return got(storeUri + '/' + encodeURIComponent(uri))
  }

  store.put.json = function(uri, data) {
    if (isJSONSerializable(data)) {
      data = JSON.stringify(data)
    }
    return got.put(storeUri + '/' + encodeURIComponent(uri), {
      json: true,
      body: data
    })
  }

  const cache = new Map()
  const dictionary = {}
  var processDefinition
  const routes = [systemRoute]
  const incomingStreams = {}
  const outgoingStreams = {}

  await initializeServer(store, config)

  return {
    server: http.createServer(async function(request, response) {
      try {
        const io = ioUtil.createIOObject(request, response, config)
        const route = routes.find(r => ajv.validate(r.test, io.i))

        //TODO move process initiation outside this try catch
        var process = createProcess(io, response)
        process.start()

        // incomingStreams[io.i.uri.complete] = request
        // outgoingStreams[io.i.uri.complete] = response

        var bodyURI = process.uri + '/resources/' + uuidv4()
        request.on('error', function(e) {
          console.log('request error')
          console.log(e)
        })

        var writeRequestBody = store.put(bodyURI).on('error', function(e) {
          console.log(e)
        })

        request.pipe(writeRequestBody)
        io.i.bodyURI = bodyURI

        if (route) {
          await handleRoute(io, route, request, response, process)
        } else {
          new Problem(404, 'No such resource.').send(response)
        }
      } catch (e) {
        handleNetworkError(e, response)
      } finally {
        process.end()
      }
    })
  }

  function createProcess(io, response) {
    const processCollection = io.i.uri.base + `/${config.systemPath}/processes/` + new Date().toISOString().replace(/\.\d\d\dZ$/, 'Z')
    var processUri = processCollection + '/' + _.uniqueId('process').replace('process', '')
    var processInfo = {
      startTime: new Date(),
      maxTargetDuration: 1,
      minTargetDuration: 1,
      endTime: null,
      io: io
    }

    var processDefinition
    // store process information

    async function addToCollection() {
      if (processDefinition) {
        await store.put(processCollection, {})
        var hasLink = processDefinition.schema.links.find(l => l.href === processCollection && l.rel === 'item')
        if (!hasLink) {
          processDefinition.schema.links.push({rel: 'item', href: processCollection})
        }
      } else {
        processDefinition = _.find(dictionary, (d, uri) => /processes$/.test(uri))
      }
    }

    return {
      uri: processUri,
      setMaxTargetDuration(duration) {
        processInfo.maxTargetDuration = duration
      },
      setMinTargetDuration(duration) {
        processInfo.minTargetDuration = duration
      },
      async start() {
        try {
          await addToCollection()
          await store.put(processUri, processInfo)
        } catch (e) {
          new Problem(500, 'Could not update process information.', errorToProblem(e)).send(response)
        }
      },
      async update(io) {

        processInfo.io = io

        try {
          await store.put(processUri, processInfo)
        } catch (e) {
          new Problem(500, 'Could not update process information.', errorToProblem(e)).send(response)
        }
      },
      async end() {
        //Update process information
        processInfo.endTime = new Date()

        try {
          await store.put(processUri, processInfo)
        } catch (e) {
          throw new Error('Could not store end process information.')
        }
      }
    }
  }

  async function setOutputFromStore(io) {
    const completeURI = io.i.uri.complete
    const hasResource = true //await store.has(completeURI)
    io.o.statusCode = 200 //TODO reimplement 404/410 etc..

    //TODO, this might better if moved out to a processor
    const definitions = _.pickBy(dictionary, d => ajv.validate(d.noun, io.i))
    const links = _.compact(_.flatten(_.map(definitions, (d, uri) => {
      //TODO I link to the whole dictionary now, I should link to the schema only
      return [
        {
          rel: 'describedBy',
          href: uri,
          title: "A description of this resource"
        }
      ].concat(d.schema.links)
    })))

    io.o.links = links
  }

  async function handleRoute(io, route, request, response, process) {
    var allSteps = route.steps
    const hasResource = true //await store.has(io.i.uri.complete)
    await setOutputFromStore(io)

    process.setMaxTargetDuration(route.steps.reduce((sum, step) => sum + step.targetDuration, 0))
    process.setMinTargetDuration(route.steps.reduce((sum, step) => sum + (
      step.test
      ? 0
      : step.targetDuration), 0))

    var result = {
      body: io
    }

    for (let i = 0; i < allSteps.length; i++) {
      try {
        let step = allSteps[i]
        if (!isSchema(step.test) || (isSchema(step.test) && ajv.validate(step.test, io))) {
          result = await got.post(step.uri, {
            json: true,
            body: result.body
          })

        }
      } catch (e) {
        throw new Problem(500, `Could not process step ${i}`, errorToProblem(e))
      }

      await process.update(result.body)
    }

    var output = result.body.o
    var statusCode = output.statusCode
    var isSuccessful = /^2\d\d$/.test(statusCode)

    if (isSuccessful) {
      //handle idempotent methods here
      if (io.i.isPUT) {

        if (io.i.isDictionaryCall) {
          let requestBody = await store.get.json(io.i.bodyURI)
          dictionary[io.i.uri.complete] = requestBody.body
        }

        if (io.i.isRouteCall) {
          let requestBody = await store.get.json(io.i.bodyURI)
          routes.push(requestBody.body)
        }

        if (hasResource) {
          statusCode = 200
        } else {
          statusCode = 201
        }

      }
    }

    //TODO find better location for this
    output.headers.vary = 'accept'
    response.writeHead(statusCode || 200, output.headers)

    store.get(io.i.uri.complete).pipe(response).on('error', function(e) {
      console.log(e)
    })
  }
}

function attemptParseBody(input, response) {
  if (isJSON(input)) {
    try {
      return JSON.parse(input.body)
    } catch (e) {
      new Problem(400, 'Invalid JSON in the body.').send(response)
      return
    }
  } else {
    return input.body
  }
}

function errorToProblem(e) {

  var additional = {
    detail: e.message,
    stack: e.stack.split('\n')
  }

  if (e instanceof got.HTTPError) {
    additional.httpDetails = e
  }

  return additional
}

function handleNetworkError(e, response) {
  if (e instanceof Problem) {
    e.send(response)
  } else {
    new Problem(500, 'An unexpected error occured.', errorToProblem(e)).send(response)
  }
}

function initializeServer(store, config) {
  var systemPath = `http://${config.manages}/${config.systemPath}`
  return Promise.all([
    store.put(`http://${config.manages}/`, {title: 'Welcome'}),
    store.put(systemPath, {title: 'System manager'}),
    store.put(systemPath + '/processes', {title: 'Process overview'}),
    store.put(systemPath + '/dictionary', {title: 'System dictionary'}),
    store.put(systemPath + '/routes', {title: 'Routes'})
  ])
}

module.exports = createServer
