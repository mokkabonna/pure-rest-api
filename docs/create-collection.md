# Creating collections


To create a collection, you simply create a new resource. Then add relations to it with rel of "item".

It will look like this:

```js
{
  meta: {
    createdAt: '2018-01-12T12:30:00Z',
    updatedAt: '2018-01-12T12:45:00Z',
    contentType: 'application/json'
    owner: 'http://martinhansen.no/martin',
    createdBy: 'http://martinhansen.no/martin',
    updatedBy: 'http://martinhansen.no/martin',
  },
  links: [
    {
      rel: 'self',
      href: 'http://martinhansen.no/posts'
    },
    {
      rel: 'item',
      href: 'http://martinhansen.no/posts/1'
    }
  ],
  actions: {
    create: {
      "name": "create-post",
      "title": "Create post",
      "method": "POST",
      "href": "http://martinhansen.no/posts"
    }
  },
  data: null //for a collection it does not normally have any data, as it is purely a meta resource that only have links
}
```
