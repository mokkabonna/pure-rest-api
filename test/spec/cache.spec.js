const chai = require('chai')
const chaiHttp = require('chai-http')
const requireUncached = require('require-uncached');
const expect = chai.expect

chai.use(chaiHttp)

describe('something', function() {
  var req
  beforeEach(function() {
    const app = requireUncached('../../src/app')
    const origin = requireUncached('../../src/origin-server')
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

    describe('caching', function() {
      it('places response in cache', function() {
        return req.put('/foo').send({foo: 5}).then(function(res) {
          expect(res.text).to.eql('')
          return req.get('/foo').then(function(res) {
            return req.get('/foo').set('if-none-match', res.headers.etag).then(failIfSuccess, function(res) {
              expect(res).to.have.status(304)
            })
          })
        })
      })
    })
  })

  describe('POST', function() {

    describe('collection exists', function() {
      const newUser = {
        username: 'mokkabonna'
      }
      beforeEach(function() {
        return req.put('/users').send([])
      })

      it('creates a single resource', function() {
        return req.post('/users').send(newUser).then(function(res) {
          expect(res).to.have.status(201)
          expect(res).to.have.header('Location', '/users/1')
          expect(res.body).to.eql(newUser)
          return req.get('/users').then(function(res) {
            expect(res.body).to.eql([newUser])
          })
        })
      })
    })
  })

  describe('GET', function() {
    describe('GET collection', function() {
      describe('does not exists yet', function() {
        it('fails with 404', function() {
          return req.get('/users').then(failIfSuccess, expect404)
        })
      })

      describe('exists', function() {
        beforeEach(function() {
          return req.put('/users').send([])
        })

        it('returns 200', function() {
          return req.get('/users').then(function(res) {
            expect(res).to.have.status(200)
            expect(res.body).to.eql([])
          })
        })

        it('returns 304 if conditional header', function() {
          return req.get('/users').then(function(res) {
            return req.get('/users').set('if-none-match', res.headers.etag).then(failIfSuccess, function(res) {
              expect(res).to.have.status(304)
            })
          })
        })
      })
    })
  })
})

function failIfSuccess(res) {
  throw new Error('Request should have failed but didn\'t. It returned ' + res.status + ' ' + JSON.stringify(res.body, null, 2))
}

function expect404(err) {
  expect(err.response).to.have.status(404)
}
