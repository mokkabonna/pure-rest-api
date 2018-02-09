var client = {
  submit(e) {
    var data = this.formToJSON(e.target)

    fetch(e.target.action, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(function(response) {
      if (response.ok) {
        return response.json()
      } else {
        return response.json().then(function(data) {
          throw new Error('Request failed: ' + JSON.stringify(data))
        })
      }
    }).then(function(data) {
      location.reload()
    }).catch(function(e) {
      alert(e)
    })

    e.preventDefault()
  },
  formToJSON(form) {
    var data = new FormData(form)
    var json = {}
    var jsonregexp = /Json$/
    var numberRegexp = /Number$/

    data.forEach(function(val, key) {
      if (numberRegexp.test(key)) {
        json[key.replace(numberRegexp, '')] = parseFloat(val)
      } else if (jsonregexp.test(key)) {
        try {
          json[key.replace(jsonregexp, '')] = JSON.parse(val)
        } catch (e) {
          alert('invalid json')
        }
      } else {
        json[key] = val
      }
    })

    return json
  },
  addRelation(e) {
    var data = this.formToJSON(e.target)

    fetch(data.uri, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json-patch+json'
      },
      body: JSON.stringify([{
        op: 'add',
        path: '/links/-',
        value: {
          rel: data.rel,
          href: data.href
        }
      }])
    }).then(function(response) {
      return response.json()
    }).then(function(data) {
      location.reload()
    })
  },
  deleteRelation(e) {
    var data = this.formToJSON(e.target)
    var path = '/links/' + data.index

    fetch(data.uri, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json-patch+json'
      },
      //Delete the relation if still in same location
      body: JSON.stringify([{
        op: 'test',
        path: path + '/rel',
        value: data.rel
      }, {
        op: 'test',
        path: path + '/href',
        value: data.href
      }, {
        op: 'remove',
        path: path
      }])
    }).then(function() {
      location.reload()
    })
  }
}

window.client = client
