# The system

This document contain a description of this system and its parts.


## Introduction

The web as a whole has reaped a lot of benefits by following part of REST principles. Generally this have been to follow the principle that GET, HEAD are safe. However when it comes to other methods like PUT (and being idempotent), the rules have been broken and therefore we have not been able to reap the benefits that comes with following REST.


## Glossary

- the system: A reference to the system that this document describes
- io: A general name for the object that is passed to and returned from processors. Can also be referred to as the request/response object.
- process manager: A central part of the system that handles the request/response
- processors: A service that processes the io object and talks HTTP with the process manager. Can be a server written in any language, and can be automatic or manual (like a human)


## Design goals

The design goals can be broken into two groups. First the well known REST design goals. Secondly some additional goals that we can reap additional benefits from following.

### REST

The system is meant to maximize the benefits of following the REST architectual style and minimize the disadvantages.

These are:

- Uniform interface
- Separation of concerns
- Stateless 
    - visibility
    - reliability
    - scalability
- Cacheability (optimizes speed)
- Evolvability
- Code on demand (optimizes speed)
- Encapsulation (layered system)

More information of the benefits can be found here http://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm

In addition to this we have some additional goals:

### Additional goals

The system should support the following:

- Transactions
- Streaming
- Robustness (survive killing the service and continue a process)
- Multiple media types
- Multiple languages
- Optimizing
- Monitoring
- Logging
- Traceability
- Abstractions

#### Transactional support

The system should support transactional writes that can be commited as a whole or rejected completely.


#### Streaming

The system should support streaming requests to keep load on the system at a minimum. This is mostly to support writing files to disk in a streaming fashion.


#### Robustness

The first thing that happens with an incoming request is to persist the transaction object, also for files. (Files are however linked to in the transaction object rather than included directly.) This gives the benefit of resuming a process at any stage if the server goes down or a processor is misbehaving or down.


#### Multiple media types

The system should do content negotiation and route the request to the correct handler. This allows for multiple representation media types without needing much work. Since the system knows about all the available media types it can (if the client prefer a strict handling) present the user with a generic 406 not acceptable response.


#### Multiple language

The system should support multiple languages. To achieve this we need to store data in a way that allows for easy retrieval of the data without IO lookup (as with media types)


#### Optimizing

Status: experimental

The process manager can perform self improvement and can submit these improvements for review, the review can be automatic or manual.

Such self improvement may be: 

- Doing races
- Self replication
    - Self scaling
    - Balancing load
- Speed optimizing (kernel update)


##### Races

The process manager can do races between comparable processors and track usage time. This information can be presented in the review.


##### Self replicating

The system can do self replication when it reaches some set limits. It does this by spawning two new services that are completely idependent of the original system. It selects about half of the resources and distributes those to the new services. The original service now only handles routing to the new services. This adds latency, but the benefit is scalability. Self replication also adds robustness since a load balancer can route requests to each service.


##### Self evolving

The system can communicate with 

---------------

#### Traceability

The process manager supplies correct authentication tokens to the processor. 

Processors that need to spawn new processes can do so, by going to the public api. The process will send an authenticate field with a token that it received to do so. The original authorization header should or could be spoofed and a new one generated on the fly. This new authorization header also acts as a correlation id. It is an authorization token that maps against the original user (need to store this for the duration of the process), so that the child process cannot do anything the original user could not do, but it also correlates the specific actions of the process server as a whole. Those are to be considered child processes of the original process.

If a process have been granted explicit permission by the originating user/client then the real authorization token could be set in the request object. In addition the generated authorization token might be provided if permissable by the original client so that the server that have received permission to do so can choose to authenticate using the new credentials, effectively doing a correlated action. Or it can choose to use the original authorization token to act on behalf of the user.

This way the process can do new actions on behalf of the user, still through the public API. But the difference being that we cannot correlate the new actions with the original one. This is a feature, not a downside. To the system the new requests using the token of the client are opaque(or is it transparent?) to the system and they are as if the client on its own sent the request. There is not way of telling if the process or the client did the request. The system can guess, but not much valuable can be obtained from it.


#### Monitoring

Each process is exposed as a resource and monitoring of them can be built by creating new resources and new processes that extract, and aggregate processes.


#### Logging

Logging is built into the system, all requests are logged when incoming.


### Abstractions

Different processors require different input and output. At the first level we have the processors that understand HTTP, these will receive an io object containing all HTTP information, like headers, status code etc.

A layer on top of that might hide the HTTP semantics and just present the body of a HTTP io object. We can construct processors that moves the "conversation" to a higher level. This opens the process up to less knowledgeable processors. For instance a human might know only the plain text format. A developer on the other hand probably understands the HTTP semantics and therefore will receive the full HTTP io object.



------------

## Constraints

To achieve these design goals we have to limit the choices the processor of the io have on the io in any given stage of any process.


### Normalization

All input needs to be normalized by strict rules so that caching can be efficient. Normalization can be done server side or enforced in the api and performed on the client with code on demand.

Consider the following:

```
1 + 2 + 3
2 + 3 + 1
3 + 1 + 2
...etc (9 combinations)
```

This is the same input and produces the same output. So to cache such an output and avoiding a cache key for all 9 combinations we can first normalize the input to 1 + 2 + 3 and cache only one result.

