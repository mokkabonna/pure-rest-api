var app = new Vue({
  el: '#app',
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
