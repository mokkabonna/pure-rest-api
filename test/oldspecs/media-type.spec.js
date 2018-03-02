const fs = require('fs')
const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

describe('media type', function() {
  var req
  var origReq
  var origin
  var mediaType
  var server
  var server2
  beforeEach(function() {
    origin = requireUncached('../../src/store')
    mediaType = requireUncached('../../src/media-type')
    const gateway = requireUncached('../../src/gateway')
    server = origin.listen(3340)
    server2 = gateway.listen(3331)
    req = chai.request(mediaType)
  })

  afterEach(function() {
    server.close()
    server2.close()
  })

  describe('PUT', function() {
    it('persists at origin server', function() {
      return req.put('/foo').send({test:5}).then(function(res) {
        expect(res).to.have.status(201)
        return req.get('/foo').then(function(res) {
          expect(res).to.have.status(200)
          expect(res.body).to.eql({
            test: 5
          })
        })
      })
    })
  })

})

function failIfSuccess(res) {
  throw new Error('Request should have failed but didn\'t. It returned ' + res.status + ' ' + JSON.stringify(res.body, null, 2))
}
