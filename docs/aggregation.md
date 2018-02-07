# Aggregation resources

Bots control much of the heavy lifting in the system. They act as entities, just as users, operating on the public api. They might have elevated permissions though, and might impersonate users (TODO: not sure if good idea)

## aggregated collections

Ownership of resources is preferred to be of a hierarchical nature, meaning we prefer ownership to be `/products/women/clothing/shoes/1` instead of simply `/products/1`

If you want to have a collection of say, `/products/max10dollars` then you should create a aggregate collection of collections.

```
/products/max10dollars

# consists of:
/products/women/clothing/shoes
/products/men/clothing/shoes
# etc..
```

Aggregate collections are always async. At creation an aggregation bot will traverse the items in the collections and apply any filter to the resources and if matching, will add it to the max price collection.

Subsequent creation of items in the subcollections will be queued for crawling and the bot will resume its job as before. In these cases the process is probably near instantaneous.

When traversing, the bot will GET the dependent resources and see that those are also collections and then start to navigate the individual resources.


## aggregated resources

Individual resources that are aggregated, often a more designed web page with custom HTML, work in much the same way.

```
/products/women/clothing/shoes/1

# consists of:
/templates/pug/342
/products/women/clothing/shoes/1
/shopping-cart
# etc..
```

The individual resources are crawled and the public designed html is templated from the dependent resources. The "design bot" runs user code that does the actual templating.
