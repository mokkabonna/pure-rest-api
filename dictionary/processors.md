# Processors

Processors are entities that moves the state of the io object forward in some fashion. This could be enrichment, composition, validation, authorization etc.

## Registration

Processors must register with the process manager before being accepted as part of the process chain. 

The following could be information that is expected to be provided:

- test: A json schema that describes the expected input.
- require: an array of JSON paths that defines what parts of the io object it needs to do the processing.
- output: an array of JSON paths that defines what parts of the io object it writes to
- terminator: a boolean that indicates if the processor can terminate the request, that is, set a status code other than 2xx


## Termination

A process that have termination rights can set the relevant status code of 3xx or 4xx.


## Async

Processors can respond async with 303 (note: not 202 here, read on) see other on their discretion or as a result of interpreting the prefer header with respond-async. In such an event processors then return a location header that points to where the resource will be located once processing is done. A retry-after header might also indicate how long the process manager should wait until it (re)tries/does the GET request. If processing is not done and the manager tries the GET request, then the processor should respond with 202, an update retry-after header can be sent. The representation for the 202 response should contain the current state of the process and a link to or embed monitoring information. If the processor chooses to respond async because of high load and some queue is filling up, it may expose a queue position.


## Blocking vs non blocking

Processors can be blocking or non blocking for the following steps in the route.


### Non blocking

A non blocking process is one that can be initiated parallel to other processes. They are however required to finish before sending the request. This could be authentication and authorization. Instead of checking authorization for each request before it is processed, and block the following steps, we can initiate all non blocking steps in parallel to other steps. This speeds up processing. It is however unwise to register a auth/authorization step as non blocking if the processing of the io is costly, or it is likely to fail authorization. 

Even write operations can be done in parallel if they depend on non collision read/write paths.


### Blocking

A blocking processor is one that blocks all following steps in the process chain. This could be coarse grained authorization, input validation etc. It is recommended that these types of processing is done before costly steps (in time or processing power)


-----------------

## Processor components

Processors can further be divided into the following:


### Processing/Operator agent

An operator agent is code that receives processing requests and prepares the io object for the process operator depending on the capabilities of the operator.

When the operator is code, a dynamic io representation could be constructed from the io object and presented to the operating code.

### Process operator

A process operator is any entity that supports operating on a representation of the io object. This may be some code that automatically perform a task, or it may be a real-world entity. Most commonly a human, but not exclusively limited to humans.

When the operator is a human, the process agent will typically present the input in a fashion that the operator understands. Typically this is rendered HTML, with javascript that enables a rich interaction to take place.
