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
    "title": "Initial system route",
    "test": {
      "properties": {
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
    "steps": []
  }

  var storeUri = 'http://martinhansen.io:3100'

  const store = {
    get: function(uri) {
      return got.stream.get(storeUri + '/' + encodeURIComponent(uri))
    },
    put: function(uri, data) {
      if (isJSONSerializable(data)) {
        data = JSON.stringify(data)
      }
      return got.stream.put(storeUri + '/' + encodeURIComponent(uri), {body: data})
    }
  }

  store.get.json = function(uri) {
    return got(storeUri + '/' + encodeURIComponent(uri))
  }

  store.put.json = function(uri, data) {
    return got.put(storeUri + '/' + encodeURIComponent(uri), {
      json: true,
      body: data
    })
  }
  const cache = new Map()
  const dictionary = {}
  var processDefinition
  const routes = [systemRoute]

  await initializeServer(store, config)

  return {
    server: http.createServer(async function(request, response) {
      try {
        const io = ioUtil.createIOObject(request, response, config)
        const route = routes.find(r => ajv.validate(r.test, io.i))

        if (!route) {
          new Problem(404, 'No such resource.').send(response)
          return
        }

        var result = await handleRoute(io, route, response)

        response.writeHead(result.o.statusCode || 200, result.o.headers)
        response.end(JSON.stringify(result.o.body))

      } catch (e) {
        handleNetworkError(e, response)
      }
    })
  }

  async function handleRoute(io, route, response, process) {
    var allSteps = route.steps

    var result = {
      body: io
    }

    await store.put.json(io.selfLink, io)

    if (io.i.isGET || io.i.isHEAD) {
      io.o.body = await store.get.json(io.selfLink).then(r => r.body)
    }

    let currentIO = io
    //Execute all steps in order
    //TODO: enable parallel processing
    for (let i = 0; i < allSteps.length; i++) {
      try {
        let step = allSteps[i]

        if (!isSchema(step.test) || (isSchema(step.test) && ajv.validate(step.test, currentIO))) {
          await startStep(currentIO, step)
          currentIO = await executeStep(io, step)
          await setStageComplete(result.body)
        } else {
          await addStartStep(currentIO, step, true)
        }
      } catch (e) {
        throw new Problem(500, `Could not process step number ${i + 1}`, {httpError: e})
      }
    }

    result.body.endTime = new Date()

    await store.put.json(io.selfLink, result.body)

    return result.body
  }
  
  async function executeStep(io, step) {
    return got.post(step.uri, {
      json: true,
      body: io
    }).then(r => r.body)
  }
  
  async function startStep(io, step, skipped) {
    let stage = {
      startTime: new Date(),
      config: step,
      skipped: skipped || false
    }

    io.stages.push(stage)
    await store.put.json(io.selfLink, io)
  }
  
  async function setStageComplete(io) {
    var stage = io.stages[io.stages.length - 1] 
    stage.responseTime = new Date()
    stage.isAsync = false // TODO handle async processing

    await store.put.json(io.selfLink, io)
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

function initializeServer(store, config) {
  var systemPath = `http://${config.manages}/${config.systemPath}`
  return Promise.all([
    store.put.json(`http://${config.manages}/`, {title: 'Welcome'}),
    store.put.json(systemPath, {title: 'System manager'}),
    store.put.json(systemPath + '/processes', {title: 'Process overview'}),
    store.put.json(systemPath + '/dictionary', {title: 'System dictionary'}),
    store.put.json(systemPath + '/routes', {title: 'Routes'})
  ])
}

module.exports = createServer
