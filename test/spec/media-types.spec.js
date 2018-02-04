const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

describe.skip('media types', function() {
  var req
  beforeEach(function() {
    const app = requireUncached('../../src/app')
    req = chai.request(app)
  })

  it('receives a media type handler', function() {
    return req.post('/media-types').send({
      urlTemplate: "/products/{id}",
      code: 'return resources.template(data)'
    }).then(function(res) {
      expect(res).to.have.status(201);
    })
  })
  
  describe('when registered', function () {
      beforeEach(function() {
         return req.post('/media-types').send({
          urlTemplate: "/products/{id}",
          code: 'return resources.render("html\\n\\tbody\\n\\t\\th1= name\\n\\t\\tp=price", data)'
        }).then(function () {
          return req.put('/products/1').send({
            name: 'Burton snowboard',
            price: 4999
          })
        }) 
      })
      
      it('responds with html', function(){
        return req.get('/products/1').set('Accept', 'text/html').then(function (res) {
          expect(res.text).to.eql('<html><body><h1>Burton snowboard</h1><p>Price: 4999</p></body></html>')
        })
      })
  })
})
