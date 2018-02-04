const fs = require('fs')
const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

describe('collection', function() {
  var req
  var origReq
  var origin
  var server
  beforeEach(function() {
    origin = requireUncached('../../src/origin-server')
    const collection = requireUncached('../../src/collection')
    server = origin.listen(3340)
    req = chai.request(collection)
  })

  afterEach(function() {
    server.close()
  })

  describe('POST', function() {
    it('persists at origin server', function() {
      return req.post('/collections').send({
        url: '/posts{/id}'
      }).then(function(res) {
        expect(res).to.have.status(201)
        expect(res).to.have.header('location', 'http://127.0.0.1:3340/posts')
        return req.post('/posts').then(function(res) {
          expect(res).to.have.status(201)
          expect(res.text).to.eql('7')
        })
      })
    })
  })

})

function failIfSuccess(res) {
  throw new Error('Request should have failed but didn\'t. It returned ' + res.status + ' ' + JSON.stringify(res.body, null, 2))
}
