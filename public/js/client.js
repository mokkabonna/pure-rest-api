var client = {
  createResource(e) {
    fetch(e.target.uri.value, {
      method: 'PUT',
      headers: {
        'content-type': 'application/vnd.tbd.data+json'
      },
      body: JSON.stringify(null)
    }).then(function(response) {
      return response.json()
    }).then(function(data) {
      location.reload()
    })

    e.preventDefault()
  },
  formToJSON(form) {
    var data = new FormData(form)
    var json = {}

    data.forEach(function(val, key) {
      json[key] = val
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
      body: JSON.stringify([
        {
          op: 'add',
          path: '/links/-',
          value: {
            rel: data.rel,
            href: data.href
          }
        }
      ])
    }).then(function(response) {
      return response.json()
    }).then(function(data) {
      location.reload()
    })
  }
}

window.client = client
