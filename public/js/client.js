var app = new Vue({
  el: '#app',
  /*render(h) {
    if (!this.json) {
      return h('div', null, 'loading')
    }

    var nav = h('nav', null, this.json.links.map(l => {
      return h('a', {
        href: l.href
      }, l.title)
    }))


    return nav
  },*/
  data() {
    return {
      data: null,
      message: 'Hello Vue!'
    }
  },
  created() {
    this.getAsJSON()
  },
  methods: {
    getAsJSON: function() {
      return fetch('', {
        headers: {
          'accept': 'application/json'
        }
      }).then(function(response) {
        return response.json()
      }).then((json) => {
        this.data = json
      })
    }
  }
})
