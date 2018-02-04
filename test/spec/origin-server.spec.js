const fs = require('fs')
const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

describe('origin server', function() {
  var req
  beforeEach(function() {
    const app = requireUncached('../../src/origin-server')
    req = chai.request(app)
  })

  describe('PUT', function() {
    describe('when creating a new resource', function() {
      it('returns 201 created', function() {
        return req.put('/foo').send('5').then(function(res) {
          expect(res).to.have.status(201)
          expect(res.text).to.eql('')
        })
      })
    })

    describe('when overwriting an existing resource', function() {
      beforeEach(function() {
        return req.put('/foo')
      })

      it('returns 204 no content', function() {
        return req.put('/foo').send('5').then(function(res) {
          expect(res).to.have.status(204)
        })
      })
    })
  })
  
  describe('DELETE', function() {
    describe('when never existed', function() {
      it('returns 204', function() {
        return req.delete('/foo').then(function(res) {
          expect(res).to.have.status(204)
        })
      })
    })
    
    describe('when exists', function() {
      beforeEach(function() {
        return req.put('/foo').send('5')
      })
      
      it('returns 200', function() {
        return req.delete('/foo').then(function(res) {
          expect(res).to.have.status(200)
        })
      })
    })
    
    describe('when used to exist', function() {
      beforeEach(function() {
        return req.put('/foo').then(function () {
           return req.delete('/foo')
        })
      })
      
      it('returns 204', function() {
        return req.delete('/foo').then(function(res) {
          expect(res).to.have.status(204)
        })
      })
    })
  })
  
  describe('GET', function() {
    describe('when never existed', function() {
      it('returns 404', function() {
        return req.get('/foo').catch(function(err) {
          expect(err.response).to.have.status(404)
        })
      })
    })
    
    describe('when exists', function() {
      beforeEach(function() {
        return req.put('/foo').send('5')
      })
      
      it('returns 200', function() {
        return req.get('/foo').then(function(res) {
          expect(res).to.have.status(200)
          expect(res.text).to.eql('5')
        })
      })
    })
    
    describe('when used to exist', function() {
      beforeEach(function() {
        return req.put('/foo').then(function () {
           return req.delete('/foo')
        })
      })
      
      it('returns 410 gone', function() {
        return req.get('/foo').then(failIfSuccess, function(err) {
          expect(err.response).to.have.status(410)
        })
      })
    })
  })
})


function failIfSuccess(res) {
  throw new Error('Request should have failed but didn\'t. It returned ' + res.status + ' ' + JSON.stringify(res.body, null, 2))
}
