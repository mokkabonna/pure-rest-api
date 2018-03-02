const fs = require('fs')
const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

describe('gateway', function() {
  var req
  var origReq
  var origin
  var server
  beforeEach(function() {
    origin = requireUncached('../../src/store')
    const gateway = requireUncached('../../src/gateway')
    server = origin.listen(3333)
    req = chai.request(gateway)
  })

  afterEach(function() {
    server.close()
  })

  describe('PUT', function() {
    it('persists at origin server', function() {
      return req.put('/foo').send('7').then(function(res) {
        expect(res).to.have.status(201)
        return req.get('/foo').then(function(res) {
          expect(res).to.have.status(200)
          expect(res.text).to.eql('7')
        })
      })
    })
  })

})

function failIfSuccess(res) {
  throw new Error('Request should have failed but didn\'t. It returned ' + res.status + ' ' + JSON.stringify(res.body, null, 2))
}
