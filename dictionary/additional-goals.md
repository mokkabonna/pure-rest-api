# Additional goals

## Automation

Because of the uniform interface, the system is optimized to be able to replace manual parts fully or partially by automation. Manual slow processors (humans) can be replaced with faster human processors or the task may be broken apart divided into two or more parallel processes or two or more sequential processes.

Here is where the main benefits of the system lies. It does not matter if the system have overhead, even mayor overhead in computer terms (seconds). What matters is that the process as a whole is more automated, and therefore cheaper. This frees up human labor to do things computers still cannot do.


## Test environments

Test environments can be created easily, they exists as subdomains. You can limit access to these. A staging environment is special in the way that is kept up to date with the main environment. When you want to go public, it is simply a matter of renaming the persisted objects keys (URIs) to that of the target domain.


## Transactional support

The system should support transactional writes that can be commited as a whole or rejected completely.


## Streaming

The system should support streaming requests to keep load on the system at a minimum. This is mostly to support writing files to disk in a streaming fashion.


## Robustness

The first thing that happens with an incoming request is to persist the transaction object, also for files. (Files are however linked to in the transaction object rather than included directly.) This gives the benefit of resuming a process at any stage if the server goes down or a processor is misbehaving or down.


## Multiple media types

The system should do content negotiation and route the request to the correct handler. This allows for multiple representation media types without needing much work. Since the system knows about all the available media types it can (if the client prefer a strict handling) present the user with a generic 406 not acceptable response.


## Multiple language

The system should support multiple languages. To achieve this we need to store data in a way that allows for easy retrieval of the data without IO lookup (as with media types)


## Optimizing

Status: experimental

The process manager can perform self improvement and can submit these improvements for review, the review can be automatic or manual.

Such self improvement may be:

- Doing races
- Self replication
    - Self scaling
    - Balancing load
- Self updating (kernel update)


### Races

The process manager can do races between comparable processors and track usage time. This information can be presented in the review.


### Self replicating

The system can do self replication when it reaches some set limits. It does this by spawning two new services that are completely idependent of the original system. It selects about half of the resources and distributes those to the new services. The original service now only handles routing to the new services. This adds latency, but the benefit is scalability. Self replication also adds robustness since a load balancer can route requests to each service.


### Self updating

The system will be self updating, processes can be run that analyzes commonly used processors, and queries those services if it has a media type of application/javascript (or other type if written in another language)

The code can be placed for review, likely both by automatic tools like esprima, eslint etc, and manual human review. If this is considered to be general enough we can add this to the system kernel. Next time this processor should be run, it will run it locally instead of doing a network request. Races can further optimize to determine if function calls should be memoized or it is simply faster to do the operation. Normalization should be part of the cost/time of memoizing it.

---------------

## Traceability

The process manager supplies correct authentication tokens to the processor.

Processors that need to spawn new processes can do so, by going to the public api. The process will send an authenticate field with a token that it received to do so. The original authorization header should or could be spoofed and a new one generated on the fly. This new authorization header also acts as a correlation id. It is an authorization token that maps against the original user (need to store this for the duration of the process), so that the child process cannot do anything the original user could not do, but it also correlates the specific actions of the process server as a whole. Those are to be considered child processes of the original process.

If a process have been granted explicit permission by the originating user/client then the real authorization token could be set in the request object. In addition the generated authorization token might be provided if permissable by the original client so that the server that have received permission to do so can choose to authenticate using the new credentials, effectively doing a correlated action. Or it can choose to use the original authorization token to act on behalf of the user.

This way the process can do new actions on behalf of the user, still through the public API. But the difference being that we cannot correlate the new actions with the original one. This is a feature, not a downside. To the system the new requests using the token of the client are opaque(or is it transparent?) to the system and they are as if the client on its own sent the request. There is not way of telling if the process or the client did the request. The system can guess, but not much valuable can be obtained from it.


## Monitoring

Each process is exposed as a resource and monitoring of them can be built by creating new resources and new processes that extract, and aggregate processes.


## Logging

Logging is built into the system, all requests are logged when incoming.


## Abstractions

Different processors require different input and output. At the first level we have the processors that understand HTTP, these will receive an io object containing all HTTP information, like headers, status code etc.

A layer on top of that might hide the HTTP semantics and just present the body of a HTTP io object. We can construct processors that moves the "conversation" to a higher level. This opens the process up to less knowledgeable processors. For instance a human might know only the plain text format. A developer on the other hand probably understands the HTTP semantics and therefore will receive the full HTTP io object.
