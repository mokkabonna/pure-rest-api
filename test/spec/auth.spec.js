const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

var auth = `if (!proxyResponse) {
  let auth = req.headers.authenticated
  if (!auth) {
    res.status(401).send()
  }
} else {}
`

describe('something', function() {
  var req
  beforeEach(function() {
    const app = requireUncached('../../src/app')
    req = chai.request(app)
  })

  beforeEach(function() {
    return req.put('/layers').send([]).then(function() {
      return req.post('/layers').set('content-type', 'text/plain').send(auth)
    })
  })

  it('fails if not authenticated', function() {
    return req.put('/foo').catch(function(err) {
      expect(err.response).to.have.status(401)
      expect(err.response.text).to.eql('')
    })
  })

})
