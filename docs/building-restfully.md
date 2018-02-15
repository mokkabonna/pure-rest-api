# Building restfully

Below are the behaviours that will happen to the system, they will not all be like that, but it paints a picture

```yaml
GET: /
  resBody: Hey you need to configure the server. You should POST to / to configure the server. You need to define where processes are stored. You also need to define processing units.

POST: /
  processesUri: /processes
  handlers: /processes/handlers
  trackingPolicies:
    - test: #fallback schema that matches all requests and tracks them, this is the default
      # can also test for things like expected response time to prevent tracking of short lived processes
      trackStart: true # true to track all, a number between 0 and 1 to track a random percentage
      trackEnd: true # true to track all, a number between 0 and 1 to track a random percentage

    PUT: /processes/0
      op: POST / # the method and uri of the public method that started the process
      startTime: new Date()

    PUT: /processes
      links:
        - rel: item
          href: /processes/0
        - rel: item # item is correct?? I mix 2 different types here, not sure if good idea
          href: /processes/handlers
        - rel: self # will be used later for creating new processes
          href: /processes

    PUT: /processes/handlers
      links:
        - rel: item
          href: /processes/handlers/0

    PUT: /processes/0
      id: 0
      startTime: samedate
      endTime: new Date()
      op: POST /

  statusCode: 201 created
  resHeaders:
    location: /processes # primary resource https://tools.ietf.org/html/rfc7231#section-4.3.3
  resBody:
    # contains representation of the operation, and links to all resources created
    # this is the processes resource and the /processes/0 that was created based upon the matching tracking policy provided
    # This could be generated automatically from start and end handling of the reqRes object

# get the root
GET: /
    PUT: /processes/1
      startTime: new Date()
      op: GET /

    GET: /

      PUT: /processes/1/1
        startTime: new Date()
        op: GET /

      # adds things like self link if not existing, expands relative URIs
      POST: /hypermedia-complementer

      PUT: /processes/1/1
        startTime: samedate
        endTime: new Date()
        op: POST /

    PUT: /processes/0
      startTime: samedate
      endTime: new Date()
      op: POST /


```

proxy/cache/man-in-the-middle/initiator processor:
The cache GET processor once configured can return 303 or 307 or any.. to the process manager and shortcut the process chain.
The uri in the location header points to the cache object.

This processor also initiates any transaction and supplies the transaction id to the processes, they will use this to do requests to the persistance server. The persistance server keep track of unsafe actions that are done using this transaction id.


Terminator processor: (probably part of the process manager)
At the end of all process chains there is a terminator that sends the response and persists data if applicable (like a PUT or a POST). For PUT it stores the response body. The terminator lives in the root process.

Single process only: I believe we should only have one process per public url. For other processing, parallel or otherwise, you should do a public http call as the process identity (and the user probably). Each unit of processing should therefore be exposed publically, but restricted access of course.

Processes that need to spawn new processes can spawn new processes, by going to the public api. The process will send an authenticate field with a token that it received to do so. The original authorization header should or could be spoofed and a new one generated on the fly. This new authorization header also acts as a correlation id. It is an authorization token that maps against the original user (need to store this for the duration of the process), so that the child process cannot do anything the original user could not do, but it also correlates the specific actions of the process server as a whole. Those are to be considered child processes of the original process.

 If a process have been granted explicit permission by the originating user/client then the real authorization token could be set in the request object. In addition the generated authorization token might be provided if permissable by the original client so that the server that have received permission to do so can choose to authenticate using the new credentials, effectively doing a correlated action. Or it can choose to use the original authorization token to act on behalf of the user.

  This way the process can do new actions on behalf of the user, still through the public API. But the difference being that we cannot correlate the new actions with the original one. This is a feature, not a downside. To the system the new requests using the token of the client are opaque(or is it transparent?) to the system and they are as if the client on its own sent the request. There is not way of telling if the process or the client did the request. The system can guess, but not much valuable can be obtained from it.

  Thoughts: Could this be the ultimate turing test over a digital protocol? See it in relation to the previous thoughts of authentication of humans. First old fashioned authentication like CAPTCHA, network of trust, then skype, then video with only the person there, then video with another person present, confirming that the person is indeed human. This could still be spoofed by an AI, creating video on it's own etc. The ultimate must be to meet the person in person.


Correlation id
  I think processes should not be allowed to be trusted to supply the correlation id.



Req res object:
```js
{
  /* contains the request information
   * can be inspected to do things like validation, authorization, redirection etc
   * can also do common things (not by processors) like rewrite url, parse json etc
   *
   * body can be modified by processors to do things like process incoming data, annotate an image, enhance the quality of the data, augment the data etc (not if PUT)
   */
  request,
  /**
   * contains by default the resource body and statusCode resulting from a GET to the storage service.
   * Can be transformed by processors to do things like support different media types
   * Allow for general handlers that for instance does a pretty 404 with some links to useful resources.
   */
  response, // or respond?
  /**
   * contains additional resources that are prefetched directly from the storage without going through the public api, this is only a few cases where this is desired. (maybe for link and data splitting?)
   * I think this should be done by the process manager
   */
  sources,
  /**
   * contains a map of items that have to be created (PUT), excluding the main resource in the response body
   * this is persisted by the terminator/manager(not sure of the name)
   * If transactional integrity is required then the persisting will happen as an atomic unit. All or nothing. Probably a lock is needed? Maybe only a lock for POST operations? I think PUT and DELETE can work without locking.
   *
   *
   */
  create,
  /**
   * contains a map of items that need to be deleted
   */
  delete
}
```
