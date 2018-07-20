looker.plugins.visualizations.add({
  id: 'collapsibletreemetric',
  label: 'Collapsible Tree Metric',
  options: {
    color_with_children: {
      type: "string",
      label: "Color Node with Children",
      display: "color",
      default: 'lightsteelblue',
    }, color_empty: {
      type: "string",
      label: "Color Empty Node",
      display: "color",
      default: '#fff',
    },
  },
  // Set up the initial state of the visualization
  create: function(element, config) {
    var d3 = d3v4;

    var css = element.innerHTML = `
      <style>
        .node circle {
          fill: ${config.color_empty};
          stroke: ${config.color_with_children};
          stroke-width: 1.5px;
        }

        .node text {
          font-family: sans-serif;
          fill: #333;
        }

        .link {
          fill: none;
          stroke: #ccc;
          stroke-width: 1.5px;
        }
      </style>
    `;

    this._svg = d3.select(element).append('svg');

  },
  burrow: function(table, taxonomy, measure) {
    // create nested object
    var obj = {};
    table.forEach(function(row) {
      // start at root
      var layer = obj;
      // create children as nested objects
      taxonomy.forEach(function(t) {
	var key = row
        var key = row[t.name].value;
        layer[key] = key in layer ? layer[key] : {};
        layer = layer[key];
      });
      layer.__data = row;
     });
    // recursively create children array
    var descend = function(obj, depth) {
      var arr = [];
      var depth = depth || 0;
      for (var k in obj) {
        if (k == '__data') { continue; }
        var child = {
          name: k,
          depth: depth,
          children: descend(obj[k], depth+1)
        };
        if ('__data' in obj[k]) {
          child.data = obj[k].__data;
        }
        arr.push(child);
      }
      return arr;
    };

    // use descend to create nested children arrys
    return {
      name: 'root',
      children: descend(obj, 1),
      depth: 0
    };
  },
  // Render in response to the data or settings changing
  update: function(data, element, config, queryResponse) {
    if (!handleErrors(this, queryResponse, {
      min_pivots: 0, max_pivots: 0,
      min_dimensions: 2, max_dimensions: undefined,
      min_measures: 0, max_measures: undefined,
    })) return;
    var d3 = d3v4;

    var nodeColors = {
      children: config.color_with_children,
      empty: config.color_empty,
    };
    var textSize = 10;
    var nodeRadius = 4;
    var i = 0;
    var duration = 750;
    var margin = {top: 10, right: 10, bottom: 10, left: 10};
    var width = element.clientWidth - margin.left - margin.right;
    var height = element.clientHeight - margin.top - margin.bottom;
    var nested = this.burrow(data, queryResponse.fields.dimension_like, queryResponse.fields.measure_like);

//Add array to except multiple measures
var label_short = queryResponse.fields.measure_like[0].label_short;
var metric_name = queryResponse.fields.measure_like[0].name;

    var svg = this._svg
      .html('')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate('+ margin.left + ',' + margin.top + ')');


    // declares a tree layout and assigns the size
    var treemap = d3.tree().size([height, width]);

    // Assigns parent, children, height, depth
    var rootNode = d3.hierarchy(nested, function(d) { return d.children; });
    rootNode.x0 = height / 2;
    rootNode.y0 = 0;

    // Collapse after the second level
    rootNode.children.forEach(collapse);

    update(rootNode);

    // Collapse the node and all it's children
    function collapse(d) {
      if(d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }

    function update(source) {

      // Assigns the x and y position for the nodes
      var treeData = treemap(rootNode);

      // Compute the new tree layout.
      var nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

      // Normalize for fixed-depth.
      nodes.forEach(function(d){ d.y = d.depth * 180});

      // ****************** Nodes section ***************************

      // Update the nodes...
      var node = svg.selectAll('g.node')
          .data(nodes, function(d) {return d.id || (d.id = ++i); });

      // Enter any new modes at the parent's previous position.
      var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', function(d) {
          return 'translate(' + source.y0 + ',' + source.x0 + ')';
        })
        .on('click', click);

      // Add Circle for the nodes
      nodeEnter.append('circle')
          .attr('class', 'node')
          .attr('r', 1e-6)
          .style('fill', function(d) {
            return d._children ? nodeColors.children : nodeColors.empty;
          });

      // Add labels for the nodes
      nodeEnter.append('text')
          .attr('dy', '.35em')
          .attr('x', function(d) {
              return d.children || d._children ? -textSize : textSize;
          })
          .attr('text-anchor', function(d) {
              return d.children || d._children ? 'end' : 'start';
          })
          .style('font-size', textSize + 'px')
          //.text(function(d) { return d.data.name; });
          .text(function(d) {
		if("data" in d.data){
			if("rendered" in d.data.data[metric_name]){
				return d.data.name + " (" + d.data.data[metric_name].rendered + " " + label_short  +  ")";
			} else { return d.data.name + " (" + d.data.data[metric_name].value + " " + label_short  +  ")"; }
		} else { return d.data.name;} 
	  });

      // UPDATE
      var nodeUpdate = nodeEnter.merge(node);

      // Transition to the proper position for the node
      nodeUpdate.transition()
        .duration(duration)
        .attr('transform', function(d) {
            return 'translate(' + d.y + ',' + d.x + ')';
         });

      // Update the node attributes and style
      nodeUpdate.select('circle.node')
        .attr('r', nodeRadius)
        .style('fill', function(d) {
            return d._children ? nodeColors.children : nodeColors.empty;
        })
        .attr('cursor', 'pointer');


      // Remove any exiting nodes
      var nodeExit = node.exit().transition()
          .duration(duration)
          .attr('transform', function(d) {
              return 'translate(' + source.y + ',' + source.x + ')';
          })
          .remove();

      // On exit reduce the node circles size to 0
      nodeExit.select('circle')
        .attr('r', 1e-6);

      // On exit reduce the opacity of text labels
      nodeExit.select('text')
        .style('fill-opacity', 1e-6);

      // ****************** links section ***************************

      // Update the links...
      var link = svg.selectAll('path.link')
          .data(links, function(d) { return d.id; });

      // Enter any new links at the parent's previous position.
      var linkEnter = link.enter().insert('path', 'g')
          .attr('class', 'link')
          .attr('d', function(d){
            var o = {x: source.x0, y: source.y0}
            return diagonal(o, o)
          });

      // UPDATE
      var linkUpdate = linkEnter.merge(link);

      // Transition back to the parent element position
      linkUpdate.transition()
          .duration(duration)
          .attr('d', function(d){ return diagonal(d, d.parent) });

      // Remove any exiting links
      var linkExit = link.exit().transition()
          .duration(duration)
          .attr('d', function(d) {
            var o = {x: source.x, y: source.y}
            return diagonal(o, o)
          })
          .remove();

      // Store the old positions for transition.
      nodes.forEach(function(d){
        d.x0 = d.x;
        d.y0 = d.y;
      });

      // Creates a curved (diagonal) path from parent to the child nodes
      function diagonal(s, d) {
        path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`

        return path
      }

      // Toggle children on click.
      function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
        update(d);
      }
    }
  }
});
