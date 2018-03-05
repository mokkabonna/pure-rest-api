const store = require('./src/store')
const got = require('./src/got')

store.listen(3100, function() {
  console.log('Store listening on 3100')
})
