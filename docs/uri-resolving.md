# URI resolving

## Trailing slash or not?

According to https://tools.ietf.org/html/rfc3986#section-5.4.1

There are no way to use achieve all forms of relative linking:

Given that I have a base URI of http://a.b/products And a relative link of **./clothes** it will resolve to http://a.b/clothes not http://a.b/products/clothes

So there exists no way to get a link of http://a.b/products/clothes without knowing that the current resource is located at **/products** Then I could use **products/clothes**

It seems that a relative link of **./clothes** and **clothes** produces the same resolved URI.

What the web need is some syntax that enables relative uris with the assumption that the current resource is located not at the bottom of a hierarchy of resources.

Some brainstorming of syntax (all produces **/products/clothes**):

- `+/clothes` (my favorite)
- `:/clothes`
- `-/clothes`
- `.../clothes`

Another solution is to make ALL resources have a trailing slash. this works fine, but IMO it implies that the resource does have additional hierarchical levels below it. This might not be true.


## Home relative link

On linux a common and useful prefix is to have "home relative" paths. Like this `~/clothes`

We should have the same on the web. It might not be called "home", but it could be some kind of user specific space for the current user. For anonymous users this would be a shared space for all anonymous users.
