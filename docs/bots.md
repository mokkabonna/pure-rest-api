# Bots

## Monitoring

Automated bots can monitor processes and track and report slow running ones, failures etc.

## Purity

Bots can inspect process information and randomly (or better) call processing resources that was skipped because of caching. If such a resource produces a different result, this can be logged and someone can review the process code to try to find the randomness and either eliminate it or return the correct cache headers.

## Changing

All process providers should be required to set the caching header, if not they should set an expiry date. As described under the purity section, bots can replay requests and if the response seem to vary over time it can mark the process provider for misbehaving and put under review.

## Optimizing

Bots can inspect process metrics and it can try to find a better provider of this process based on the contract the process implements. The bot can navigate the wider web and when it has found the better process provider it can run tests against it and determine if it is performing better. If so, it can suggest (or do so automatically) to replace the current process in charge of that operation. It can also add both process to a list that the process manager uses to select an alternate provider from if one service goes down. It could even do a race between the processes at any time if the process is cheap.

For outputs that have a concept of quality, a set of results can be presented to a reviewer, automatic or manual. If it passes the review it will preferably be used instead of the existing process.


## Testing the system

Instead of writing time consuming unit tests I think we can do better.

### Dead links

A bot traverses and reports these.

### Idempotency

A bot traverses and tests idempotency. To fully work, the system needs to be put in a state of maintenance so that we are sure no one else are writing to the system. Can probably find a way to disallow just for one resource at a time.

## Deletion

A bot can delete resources and later put them to test deletion.

## TRACE

A bot can issue TRACE commands to determine if there are any misbehaving proxy in the middle.
