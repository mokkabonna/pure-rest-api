# Abstractions

## HTTP

A processor that understands HTTP will receive the full HTTP io object.

## Plain text

Example:

```js
{
  i: {
    method: 'GET',
    headers: {
        authorization: 'token abcdefdasf'
    },
    uri: {
        ...etc
        path: ['health-information']
    }
  },
  o: {
      body: {
          title: 'Some secret'
      }
  }
}
```
=>

Request to read: 


Is this ok?


```pug
button OK
button No

=>

form
    label explanation:
        textarea

    button
        No
```

```js
{
  i: {
    body: "Martin Hansen want to get the [health information](http://martinhansen.io/health-information)."
  },
  o: {
    answer: 'yes', //yes, no, maybe
    explanation: "You can not since this is not something I want to share. You may get this if you provide a reason for why."
  }
}
```

=>

```js
{
  i: {
    method: 'GET',
    headers: {
        authorization: 'token abcdefdasf'
    },
    uri: {
        ...etc
        path: ['health', 1]
    }
  },
  o: {
      statusCode: 403, //forbidden
      body: {
         explanation: "You can not since this is not something I want to share. You may get this if you provide a reason for why."
      }
  }
}
```

