# Client api generated from entity representation, entity links and options

Can be generated client side or server side.

```js
// the client
var io = {} 

io.get().then(function (server) {
  console.log(server.rep.title)
  return server.io.get.about().then(function (about) {
    console.log(about.representation.title)
  })
})

io.get.products(1).then(function handleExistingProduct(product) {
  product.io.get.invoice()
})

io.post.products().then(handleNewProduct)

io.put.products(1, {
  name: 'Some shoes'
}).then(handleNewOrChangedProduct)

io.delete.products(1).then(handleDelete).catch(function handleErrors(err) {
  if (err instanceof io.NotFoundError) {
    console.log(err.representation.)
  }else if(err instanceof io.notAcc){}
})
```