$(document).ready(function() {

  var URLtoData = function(hash) {
    return JSON.parse(atob(decodeURIComponent(hash.slice(1))))
  }
  
  var dataToURL = function(data) {
    return '#' + encodeURIComponent(btoa(JSON.stringify(data)))
  }

  var DataModel = Backbone.Model.extend({
    defaults: {
      text: 'hey'
    },
    
    initialize: function() {
      this.on('change', function() {
        window.location.hash = dataToURL(this.toJSON())
      })
    }
  });

  var DataView = Marionette.ItemView.extend({

    template: '#text-template',
    
    modelEvents: {
      'change': 'render'
    }

  })

  var myApp = new Backbone.Marionette.Application();

  myApp.addInitializer(function(options) {

    myApp.addRegions({
      textAnchor: '#text-anchor'
    });

    var data = new DataModel(URLtoData(window.location.hash));
    
    window.data = data

    var view = new DataView({
      model: data
    })

    myApp.textAnchor.show(view);

  });

  myApp.start();
});
