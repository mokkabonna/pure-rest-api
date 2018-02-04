# Media types

## default media type
The base media type is application/json. This is also the result of the media type application/vnd.tbd+json

Then the representation looks like this:

```js
{
  meta: {
    createdAt: '2018-01-12T12:30:00Z',
    updatedAt: '2018-01-12T12:30:00Z',
    contentType: 'application/json'
    owner: 'http://martinhansen.no/martin',
    createdBy: 'http://martinhansen.no/martin',
    updatedBy: 'http://martinhansen.no/martin',
  },
  links: [
    {
      rel: 'self',
      href: 'http://martinhansen.no/posts/1'
    },
    {
      rel: 'http://martinhansen.no/relations/feedback',
      title: 'Comments for this post',
      href: 'http://martinhansen.no/posts/1/comments'
    }
  ],
  actions: [{
    "name": "delete",
    "title": "Delete post",
    "method": "DELETE",
    "href": "http://martinhansen.no/posts/1"
  }],
  data: {
    title: 'My first blog post',
    body: 'This is the body of my post. \n>There are only two hard things in Computer Science: cache invalidation and naming things.'
  }
}
```

For PUT operations on a resource using the default media type, you need to supply the full object as defined above.

For most resources, that is not possible as some values are set by the system itself. You normally just want to update the data itself. Then use the raw data media type.

## Raw data

For operating on only the data with PUT, you need to use the application/vnd.tbd.data+json media type.

The receiving server will understand that you wish to put the enclosed entity as the data of the resource. It will also update any relevant meta properties, like updatedAt and updatedBy.

A raw response looks like this:

```
GET /posts/1
Content-Type: application/vnd.tbd.data+json
```

```js
{
  title: 'My first blog post',
  body: 'This is the body of my post.\n>There are only two hard things in Computer Science: cache invalidation and naming things.'
}
```


## HTML

Some resources have a specifically created human friendly representation in the form of HTML.

You can get this representation with the normal text/html media type.

```
GET /posts/1
Content-Type: text/html
```

```html
<html>
<head>
<title>My first blog post</title>
</head>
<body>
  <h1>My first blog post</h1>
  <p>
    This is the body of my post.
    <blockquote>
      There are only two hard things in Computer Science: cache invalidation and naming things.
    </blockquote>
  </p>
</body>
</html>
```

### Generic HTML

Most resources also have a generic generated HTML that is based on the data, its metadata and relations and actions(forms). If no specific HTML is defined, then the generic one is supplied. To force this generic media type to be delivered, use the media type text/vnd.tbd+HTML


It might look like:

```html
<html>
<head>
<title>My first blog post</title>
<div>
</head>
<body>
  <h1>My first blog post</h1>
  <p>
    This is the body of my post.
    <blockquote>
      There are only two hard things in Computer Science: cache invalidation and naming things.
    </blockquote>
  </p>
  <ul class="links">
    <li><a href="http://martinhansen.no/posts/1/comments">Comments for this post</a></li>
  </ul>
  <div class="actions">
    <button type="button" name="button" onclick="client.delete()">Delete post</button>
  </div>
</body>
</html>
```
