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

