const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

describe('something', function() {
  var req
  beforeEach(function() {
    const app = requireUncached('../../src/app')
    req = chai.request(app)
  })

  it('fails if not authenticated', function() {
    return req.put('/foo').catch(function(err) {
      expect(err.response).to.have.status(401)
      expect(err.response.text).to.eql('')
    })
  })

})
