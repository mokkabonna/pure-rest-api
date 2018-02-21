# Transactions and processes

How to deal with one public operation that result in several internal calls?

I need a system that does transaction like operations. Maybe I can use the REST fundamentals in terms of idempotency etc to later do cleanup if something fails?

Maybe give the store direct capabilities to create a transaction and then commit it when all parts of the transaction have reached the store.


## Processes

Each process that is registered for a certain resource has to say the resolution of the time it is expected to take.

This can for instance be:


- milliseconds
- seconds
- minutes
- hours
- days
- years
- etc

Based on this information we can immediately return 202 for long running processes. We can also return 202 if a process exceeds a certain percentage over the expected. Then we create a queue item that represents the status of the process.



Processes are allowed to do different things based upon what method is being processed.
Some processes can be done in parallel. This is branching out.

FIX: For http processes, most should be handled by the system itself, not be separate processors. So Authentication and Authorization, redirection, validation, logging. Possibly also add to sources object.

## Order of process

Authentication
Method and URI based Authorization (possibly handled by the root process?) This can be non blocking, but is required to pass before signing off on the response. For costly and/or long running complex processes it should be blocking. This is to prevent the initiation of an expensive operation.
Redirection
Validation
Rewriting URI

Add to sources object (via and item link relations)
Composing of resources
Transformation to media types, or transformation in general

Authorizing processes can be injected pretty much anywhere. These can be blocking or non-blocking. This can be determined by the server itself by returning 202.

## GET
Get is not allowed to create any items in the transaction as the user, but a process can do so if given permission to do so. Each process gets it's own namespace on the root process and can write to it for things like cache etc. It can not be sure of the existence of those resources, as the root process may delete them to free up resources. It might do so based upon how frequently those items are requested.

## POST
Post can augment and alter input data and modify the existing ONE target resource or create one or several resources.

## PUT
PUT is not allowed to alter request body in any way. But it can validate etc as any other.
