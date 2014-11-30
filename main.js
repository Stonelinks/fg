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
      title: 'Double click to edit title',
      links: [{source: 'Microsoft', target: 'Amazon', type: 'licensing'},
              {source: 'Microsoft', target: 'Amazon', type: 'suit'},
              {source: 'Samsung', target: 'Apple', type: 'suit'},
              {source: 'Microsoft', target: 'Amazon', type: 'resolved'},
              {source: 'Microsoft', target: 'Apple', type: 'resolved'}]
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
      'change:title': 'render'
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
        this.model.set('title', DataModel.prototype.defaults.title);
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

  var GraphView = Marionette.ItemView.extend({

    template: '#graph-template',

    modelEvents: {
      'change:links': 'update'
    },

    update: function() {

      this.$el.find('#graph-root svg').remove();

      // need to clone since a bunch of meta data gets added that will screw things up
      var links = this.model.get('links').map(_.clone);

      // sort links by source, then target
      links.sort(function(a, b) {
        if (a.source > b.source) {
          return 1;
        }
        else if (a.source < b.source) {
          return -1;
        }
        else {
          if (a.target > b.target) {
            return 1;
          }
          if (a.target < b.target) {
            return -1;
          }
          else {
            return 0;
          }
        }
      });
links;
      // any links with duplicate source and target get an incremented 'linknum'
      for (var i = 0; i < links.length; i++) {
        if (i != 0 &&
          links[i].source == links[i - 1].source &&
          links[i].target == links[i - 1].target) {
            links[i].linknum = links[i - 1].linknum + 1;
          }
        else {
          links[i].linknum = 1;
        }
      }

      var nodes = {};

      // compute the distinct nodes from the links.
      links.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {
          name: link.source
        });
        link.target = nodes[link.target] || (nodes[link.target] = {
          name: link.target
        });
      });

      var w = 800,
          h = 600;

      var force = d3.layout.force()
          .nodes(d3.values(nodes))
          .links(links)
          .size([w, h])
          .linkDistance(60)
          .charge(-300)
          .on('tick', tick)
          .start();

      var svg = d3.select('#graph-root').append('svg:svg')
          .attr('width', w)
          .attr('height', h);

      // Per-type markers, as they don't inherit styles.
      svg.append('svg:defs').selectAll('marker')
          .data(['suit', 'licensing', 'resolved'])
        .enter().append('svg:marker')
          .attr('id', String)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 15)
          .attr('refY', -1.5)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
        .append('svg:path')
          .attr('d', 'M0,-5L10,0L0,5');

      var path = svg.append('svg:g').selectAll('path')
          .data(force.links())
        .enter().append('svg:path')
          .attr('class', function(d) { return 'link ' + d.type; })
          .attr('marker-end', function(d) { return 'url(#' + d.type + ')'; });

      var circle = svg.append('svg:g').selectAll('circle')
          .data(force.nodes())
        .enter().append('svg:circle')
          .attr('r', 6)
          .call(force.drag);

      var text = svg.append('svg:g').selectAll('g')
          .data(force.nodes())
        .enter().append('svg:g');

      // A copy of the text with a thick white stroke for legibility.
      text.append('svg:text')
          .attr('x', 8)
          .attr('y', '.31em')
          .attr('class', 'shadow')
          .text(function(d) { return d.name; });

      text.append('svg:text')
          .attr('x', 8)
          .attr('y', '.31em')
          .text(function(d) { return d.name; });

      // Use elliptical arc path segments to doubly-encode directionality.
      function tick() {
        path.attr('d', function(d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = 75 / d.linknum;  //linknum is defined above
          return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
        });

        circle.attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        });

        text.attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        });
      }
    },

    initialize: function(options) {

      this.on('show', function() {

        this.update();

      });

    }
  });

  var myApp = new Backbone.Marionette.Application();

  myApp.addInitializer(function(options) {

    myApp.addRegions({
      titleAnchor: '#title-anchor',
      graphAnchor: '#graph-anchor',
      controlsAnchor: '#controls-anchor'
    });

    var urlData = URLtoData(window.location.hash);
    inspect(urlData);

    var data = new DataModel(urlData);

    window.data = data;

    var titleView = new TitleView({
      model: data
    });
    myApp.titleAnchor.show(titleView);

    var graphView = new GraphView({
      model: data
    });
    myApp.graphAnchor.show(graphView);

  });

  myApp.start();
});
