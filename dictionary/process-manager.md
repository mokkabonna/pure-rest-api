# Process manager

The process manager is the sentral part of the system, All request are handled here. It is the enforcer of the HTTP/REST semantics.


Typically what happens for an incoming GET request is:

1. Create io object from request and response object
2. A routing function finds the first matching route handler
3. The io object is persisted
4. Process information is persisted and exposed in an API
5. The io.o.body object is populated with any data that is persisted for the URI
6. The steps in the process are executed one by one
7. The result of each step is persisted.
8. The process manager sends the response based upon the io.o object

The process manager also controls what properties each processor are allowed to change. Each process need to define what properties it need to read, and which ones to write.


## Input parsing

Parsers are registered with the process manager, and parses the io.i object by turning strings to JSON primitives.


## Input normalization

All input is normalized to allow for proper caching.


## Routing

Based upon the method and URI, we find the first route that handles this operation. A catch all SHOULD be defined to provide for a friendly 404 page for the user.


## Content negotiation

Each route also defines what media type and language it handles. When doing content negotiation the process manager. It then finds the steps (if any) that handles the negotiated media type and language. The steps in the route are then executed as normal. If the client has a prefer header of negotiation=strict, a 406 not acceptable is returned with a friendly representation that among other information contains direct links to all the available media types and lanugages. The user agent or the user can then select the most appropriate one.

The manager makes sure to set the correct vary header based upon content negotiation.


## Caching

All responses are cached by the manager, and the next time such a equivalent request is made it is instead served from the cache.


