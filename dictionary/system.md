# The system

[This document](system.md) contain a description of [this system](/) and its parts.


## Introduction

The web as a whole has reaped a lot of benefits by following part of REST principles. Generally this have been to follow the principle that GET, HEAD are safe. However when it comes to other methods like PUT (and being idempotent), the rules have been broken and therefore we have not been able to reap the benefits that comes with following REST.


## Contents

- [Glossary](#glossary)
- [Design goals](#design-goals)
  - [REST](#rest)
  - [Additional goals](#additional-goals)
    - [Automation](additional-goals#automation)
    - [Test environments](additional-goals#test-environments)
    - [Transactions](additional-goals#transactions)
    - [Streaming](additional-goals#streaming)
    - [Robustness](additional-goals#robustness)
    - [Multiple media types](additional-goals#multiple-media-types)
    - [Multiple languages](additional-goals#multiple-languages)
    - [Optimizing](additional-goals#optimizing)
    - [Monitoring](additional-goals#monitoring)
    - [Logging](additional-goals#logging)
    - [Traceability](additional-goals#traceability)
    - [Abstractions](additional-goals#abstractions)

## Glossary

- [the system](system.md): A reference to the system that this document describes
- [io](io.md): A general name for the object that is passed to and returned from processors. Can also be referred to as the request/response object.
- [process manager](process-manager.md): A central part of the system that handles the request/response
- [processors](processors.md): A web service that processes the io object and talks HTTP with the process manager. Can be a server written in any language, and can be automatic and/or manual (like a human)


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

The system should be designed to support the following:

- Automation
- Test environments
- Transactions
- Streaming
- Robustness
- Multiple media types
- Multiple languages
- Optimizing
- Monitoring
- Logging
- Traceability
- Abstractions

Read more about [additional goals](additional-goals.md)

## Constraints

To achieve these design goals we have to limit the choices the processor of the io have on the io at any given stage of any process.


### Normalization

All input needs to be normalized by strict rules so that caching can be efficient. Normalization can be done server side or enforced in the api and performed on the client with code on demand. If this strategy is chosen, the request could be automatically rejected if not conforming to the normalization requirements.

Consider the following:

```
1 + 2 + 3
2 + 3 + 1
3 + 1 + 2
...etc (9 combinations)
```

This is the same input and produces the same output. So to cache such an output and avoiding a cache key for all 9 combinations we can first normalize the input to 1 + 2 + 3 and cache only one result.
