# Todos

- [ ] Surfing proxy, store all requests and responses. Setup proxy and vpn. Then later I can organize it and connect it.
- [ ] Authentication and authorization
- [ ] Versioning and immutable
- [ ] Logging processor, this might log in parallel or sequentially depending on the importance of the logs
- [ ] Monitoring (maybe as a bot)
- [ ] Implement reverse proxy with caching (maybe use got.js or make http-proxy support custom request)
- [ ] Make root url absolutely not cacheable
- [ ] Use express promise based send
- [ ] Create library that allows for transformation of string to json primitives
- [ ] Create library that converts a schema json pointer to a instance json pointer
- [ ] Implement better body parsing that allow for any JSON value
- [ ] Implement default type of application/octet-stream in store
- [ ] Implement a http server that does HTTP based writes, reads deletes, and even 410 gone?
- [ ] Test possibility to create a true sandbox in js, deleting all objects in the global scope, disallow [], {} with esprima etc
- [ ]


## Process manager

- [ ] Expose processes as a resource (inspect time, processors, individual results etc)
- [ ] To support easy adding of links, create a processor that allow PUT link to a resource by relation type (PUT /resource/links/{rel}/{uri})
- [ ] Implement json schema and json hyper schema, a test schema that determines of the processor should be used and a "read/write" schema that have read-only and write-only attributes set. The process manager only passes on the data that is defined in this schema.
- [ ] Cache responses from the process based upon input data
- [ ] Move router logic into a process
- [ ] Move all express login into a process, use native http createServer

## Async processor

- [ ] Create async processor that returns 202 and creates a queue item that the client can use to find the result when processing is done
- [ ] Append the reqRes object with expected time of processing based on earlier processing or static target response time defined in the step config
- [ ] Respect the prefer header

## Vue text/html

- [ ] Add generation of generic vue component for resources
- [ ] Allow for specifying composite resources with specific vue code
- [ ] Support dynamic routing for vue

## html from text/commonMark

- [ ] Generate html from text/commonMark
- [ ] For links in the markdown we can GET that and if media type text/commonMark we can inline the html.
- [ ] Add functional to check checkboxes


## Prefer header

- [ ] Specify new prefer header to enable strict handling of accept headers, returning 406 not acceptable instead of default representation (negotiate=strict)
- [ ] Automatically generate a response that lists possible media types, language and encoding

## JSON pick npm module

- [ ] Takes a json schema and returns a new object based upon the properties defined in the schema.
