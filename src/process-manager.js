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

const readFile = util.promisify(fs.readFile)
const isSchema = val => _.isPlainObject(val) || val === true || val === false

var processStore = new Map()
var ajv = new Ajv()

async function createServer(config) {
  config = config || {}

  const store = new Map()
  const cache = new Map()
  const dictionary = {}
  var processDefinition
  const routes = [] // TODO make object

  await initializeServer(store, config)

  return {
    server: http.createServer(async function(request, response) {
      const body = []
      const io = ioUtil.createIOObject(request, response)
      const uri = io.i.uri.complete

      request.on('error', (err) => {
        console.error(err)
      }).on('data', (chunk) => {
        body.push(chunk)
      }).on('end', async () => {
        try {
          io.i.body = Buffer.concat(body).toString()
          io.i.body = attemptParseBody(io.i, response)

          var route = routes.find(r => ajv.validate(r.test, io.i))
          const endProcess = await createAndPersistProcessInformation(io)

          await setOutputFromStore(io, uri)

          if (route) {
            await handleRoute(io, route, response)
          } else {
            await handleNoRoute(io, response, store)
          }

          await endProcess()
        } catch (e) {
          handleNetworkError(e, response)
        }
      })
    })
  }

  async function createAndPersistProcessInformation(io) {
    const processCollection = io.i.uri.base + `/${config.systemPath}/processes/` + new Date().toISOString().replace(/\.\d\d\dZ$/, 'Z')
    var processUri = processCollection + '/' + _.uniqueId('process').replace('process', '')
    var processInfo = createProcessInfoObject(io)

    // store process information
    try {

      if (processDefinition) {
        var collection = await store.get(processCollection)
        await store.set(processCollection, (collection || []).concat([processUri]))
        var hasLink = processDefinition.schema.links.find(l => l.href === processCollection && l.rel === 'item')
        if (!hasLink) {
          processDefinition.schema.links.push({rel: 'item', href: processCollection})
        }
      } else {
        processDefinition = _.find(dictionary, (d, uri) => /processes$/.test(uri))
      }

      await store.set(processUri, processInfo)

      return async function endProcess() {
        //Update process information
        processInfo.endTime = new Date()

        try {
          await store.set(processUri, processInfo)
        } catch (e) {
          throw new Error('Could not store end process information.')
        }
      }
    } catch (e) {
      throw new Error('Could not store process information.' + e.message)
    }

  }

  async function setOutputFromStore(io, completeURI) {
    const hasResource = await store.has(completeURI)
    const resourceData = await store.get(completeURI)
    io.o.statusCode = hasResource
      ? (
        resourceData === undefined
        ? 410
        : 200)
      : 404

    //TODO, this might better if moved out to a processor
    const definitions = _.pickBy(dictionary, d => ajv.validate(d.noun, io.i))
    const links = _.compact(_.flatten(_.map(definitions, (d, uri) => {
      //TODO I link to the whole dictionary now, I should link to the schema only
      return [
        {
          rel: 'describedBy',
          href: uri
        }
      ].concat(d.schema.links)
    })))

    io.o.body = {
      data: resourceData,
      links: links
    }

  }

  async function handleNoRoute(io, response, store) {
    var isDictionaryCall = io.i.uri.path[0] === config.systemPath && io.i.uri.path[1] === 'dictionary' && io.i.uri.path.length === 3
    var isRouteCall = io.i.uri.path[0] === config.systemPath && io.i.uri.path[1] === 'routes' && io.i.uri.path.length === 3
    // default REST handling

    if (io.i.method === 'PUT') {
      await store.set(io.i.uri.complete, io.i.body)
      if (isDictionaryCall) {
        dictionary[io.i.uri.complete] = io.i.body
      } else if (isRouteCall) {
        routes.push(io.i.body)
      }
      const wasCreated = io.o.body.data !== undefined
      response.writeHead(
        wasCreated
        ? 201
        : 204)
      response.end('PUT successful') //TODO better handling here according to spec
    } else if (io.i.method === 'GET' && io.o.statusCode === 200) {
      response.end(JSON.stringify(io.o.body))
    } else {
      new Problem(404, 'No such resource.').send(response)
    }
  }
}

async function handleRoute(io, route, response) {
  var allSteps = route.steps

  var result = {
    body: io
  }

  //Execute all steps in order
  //TODO: enable parallel processing
  for (let i = 0; i < allSteps.length; i++) {
    try {
      let step = allSteps[i]
      if (!isSchema(step.test) || (isSchema(step.test) && ajv.validate(step.test, io.i))) {
        result = await got.post(step.uri, {
          json: true,
          body: result.body
        })
      }
    } catch (e) {
      throw new Problem(500, `Could not process step ${i}`, {httpError: e})
    }
  }

  var output = result.body.o
  response.writeHead(output.statusCode || 200, output.headers)
  response.end(JSON.stringify(output.body))
}

function attemptParseBody(input, response) {
  if (input.headers['content-type'] === 'application/json') {
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

function handleNetworkError(e, response) {
  if (e instanceof Problem) {
    e.send(response)
  } else {
    new Problem(500, 'An unexpected error occured.', {
      detail: e.message,
      stack: e.stack.split('\n')
    }).send(response)
  }
}

function createProcessInfoObject(io) {
  return {startTime: new Date(), endTime: null, io: io}
}

function initializeServer(store, config) {
  var systemPath = `http://${config.manages}/${config.systemPath}`
  return Promise.all([
    store.set(`http://${config.manages}/`, {title: 'Welcome'}),
    store.set(systemPath, {title: 'System manager'}),
    store.set(systemPath + '/processes', {title: 'Process overview'}),
    store.set(systemPath + '/dictionary', {title: 'System dictionary'}),
    store.set(systemPath + '/routes', {title: 'Routes'})
  ])
}

module.exports = createServer
