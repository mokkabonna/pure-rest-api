const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

describe('store', function() {
  var req
  var item
  beforeEach(function() {
    item = {
      id: 5
    }
    const app = requireUncached('../../src/store')
    req = chai.request(app)
  })

  describe('PUT', function() {
    it('requires a description first', function() {
      return req.put('/all/foo').send(item).then(failIfSuccess).catch(function(err) {
        expect(err).to.have.status(400)
      })
    })

    describe('when item in dictionary', function() {
      beforeEach(function() {
        return req.put('/dictionary/everything').send({
          describes: true,
          description: 'A description of everything in this domain.'
        })
      })

      it('places item in store', function() {
        return req.put('/all/foo').send(item).then(function(res) {
          expect(res).to.have.status(201)
        })
      })
    })
  })

  describe('GET', function() {
    beforeEach(function() {
      return req.put('/dictionary/everything')
    })

    it('behaves like this', function() {

    })
  })
})

function failIfSuccess(res) {
  throw new Error('Request should have failed but didn\'t. It returned ' + res.status + ' ' + JSON.stringify(res.body, null, 2))
}
