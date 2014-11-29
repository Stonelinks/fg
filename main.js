$(document).ready(function() {

  var inspect = function(thing) {
    console.log(JSON.stringify(thing, null, 4));
  };

  var URLtoData = function(hash) {
    return hash ? JSON.parse(atob(decodeURIComponent(hash.slice(1)))) : {};
  };

  var dataToURL = function(data) {
    return '#' + encodeURIComponent(btoa(JSON.stringify(data)));
  };

  var DataModel = Backbone.Model.extend({
    defaults: {
      title: 'Double click to edit title'
    },

    initialize: function() {
      this.on('change', function() {
        window.location.hash = dataToURL(this.toJSON());
      });
    }
  });

  var TitleView = Marionette.ItemView.extend({

    template: '#title-template',

    modelEvents: {
      'change': 'render'
    },

    ui: {
      edit: '.edit',
      label: '.title-label'
    },

    events: {
      'dblclick @ui.label': 'onEditClick',
      'keydown @ui.edit': 'onEditKeypress',
      'focusout @ui.edit': 'onEditFocusout'
    },

    onEditClick: function() {
      this.$el.addClass('editing');
      this.ui.edit.focus();
      this.ui.edit.val(this.ui.edit.val());
    },

    onEditFocusout: function() {
      var todoText = this.ui.edit.val().trim();
      if (todoText) {
        this.model.set('title', todoText);
      }
      else {
        this.model.set('title', DataModel.prototype.defaults.title);;
      }
      this.$el.removeClass('editing');
    },

    onEditKeypress: function(e) {
      var ENTER_KEY = 13;
      var ESC_KEY = 27;

      if (e.which === ENTER_KEY) {
        this.onEditFocusout();
        return;
      }

      if (e.which === ESC_KEY) {
        this.ui.edit.val(this.model.get('title'));
        this.$el.removeClass('editing');
      }
    }
  });

  var myApp = new Backbone.Marionette.Application();

  myApp.addInitializer(function(options) {

    myApp.addRegions({
      titleAnchor: '#title-anchor',
      graphAnchor: '#graph-anchor',
      controlsAnchor: '#controls-anchor'
    });
    
    var urlData = URLtoData(window.location.hash)
    inspect(urlData)

    var data = new DataModel(urlData);

    window.data = data;

    var titleView = new TitleView({
      model: data
    });
    myApp.titleAnchor.show(titleView);

  });

  myApp.start();
});
