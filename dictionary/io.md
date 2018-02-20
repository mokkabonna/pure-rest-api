# io

This is an abbreviation of input/output. Also sometimes referred to as the request/response object.

This is the object that is passed to processors. When a process is first started, the process manager fetches any existing resource from the persistence store.

The object always have two properties:

- i: The input data
- o: The output data

It will typically look like this:

```js
{
  i: {
    method: 'GET',
    uri: {
      host: ['io', 'martinhansen'], //host is reversed to allow for easy namespacing
      path: ['products'],
      ...etc
    }
  },
  o: {
    statusCode: 200,
    body: 'Hello world!'
  }
}
```

A process operator will generally directly manipulate the io object. What it does depends upon what that processor does. It might be validation, authorization, enrichment etc.
