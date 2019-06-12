looker.plugins.visualizations.add({
	id: "animated-line",
	label: "Animated Line",
	options: {
		/*imageWidth: {
      			label: "Image Width",
      			type: "string",
      			default: "20px",
			section: "Image",
			order: 0
    		},
		imageheight: {
			label: "Image Height",
			type: "string",
			default: "20px",
			section: "Image",
			order: 1
		},*/
		xAxisLabel: {
			label: "x-Axis Label",
			type: "string",
			default: "",
			placeholder: "Label",
			section: "x-Axis",
			order: 0
		},
		xCustomStart: {
                        label: "Custom Origin",
                        type: "boolean",
                        default: false,
                        section: "x-Axis",
                        order: 1
                },
                xCustomStartValue: {
                        label: "Custom Origin Value",
                        type: "string",
                        default: "0",
                        section: "x-Axis",
                        order: 2
                },
		yAxisLabel: {
			label: "y-Axis Label",
			type: "string",
			default: "",
			section: "y-Axis",
			order: 0
		},
		yCustomStart: {
                        label: "Custom Origin",
                        type: "boolean",
                        default: false,
                        section: "y-Axis",
                        order: 1
                },
		yCustomStartValue: {
                        label: "Custom Origin Value",
                        type: "string",
                        default: "0",
                        section: "y-Axis",
                        order: 2
                },
		animationDuration: {
			label: "Animation Duration",
			type: "string",
			default: "6000",
			section: "Animation",
			order: 1
		}
	},

	create: function(element, config) {
		idNum = Math.floor((Math.random() * 10000000) + 1);
		element.innerHTML = "";
		element.setAttribute("id","animated-line-" + idNum);
	},

	update: function(data, element, config, queryResponse) {
		
		//Get id for element
		var visId = $(element).attr('id');
		//Error Handling
		//Clear any errors from previos updates
		this.clearErrors();
		var isPivot = false;

		if (queryResponse.pivots.length != 0) {
			isPivot = true;
                        if (queryResponse.fields.dimensions.length !== 1) {
	        		this.addError({title: "Incorrect Number of Dimensions", message: "This chart requires 1 dimensions."});
        	                return;
			}
                } else if (queryResponse.fields.dimensions.length !== 2) {
     				this.addError({title: "Incorrect Number of Dimensions", message: "This chart requires 2 dimensions."});
      				return;
    		}
		if (queryResponse.fields.measures.length != 1 && queryResponse.fields.table_calculations.length != 1) {
     			this.addError({title: "Incorrect Number of Measures", message: "This chart requires 1 measure or 1 table calculation."});
      			return;
		}

		var css = element.innerHTML = `
		<style>
			.viz-container {
			  font: 11px sans-serif;
			}

			.axis path,
			.axis line {
			  fill: none;
			  stroke: #000;
			  shape-rendering: crispEdges;
			}

			path.line {
  			  fill: none;
  			  stroke: #666;
 			  stroke-width: 1.5px;
			}

			path.area {
  			  fill: #e7e7e7;
			}

			.axis {
  			  shape-rendering: crispEdges;
			}

			.x.axis line {
  			  stroke: #fff;
			}

			.x.axis .minor {
  			  stroke-opacity: .5;
			}

			.x.axis path {
  			  display: none;
			}

			.y.axis line, .y.axis path {
  			  fill: none;
  			  stroke: #000;
			}

			.x.axis line, .x.axis path {
                          fill: none;
                          stroke: #000;
                        }

			.guideline {
 			  margin-right: 100px;
  			  float: right;
			}
		</style>`

		//Create asscciate arrays
		var sets = [],
		    keys = [],
		    ySum = 0,
		    xSum = 0;

		//Get pivot keys
		//queryResponse.pivots.forEach(function(column) {
		//	keys.push(column.key)
		//});

		for(var row of data){
			var set = [];
			var dimension_object_date = row[queryResponse.fields.dimensions[0].name];
			var dimension_html_date = LookerCharts.Utils.htmlForCell(dimension_object_date);
			var dimension_name_date = LookerCharts.Utils.textForCell(dimension_object_date);
			if(!isPivot){
				var dimension_object_text = row[queryResponse.fields.dimensions[1].name];
                        	var dimension_html_text = LookerCharts.Utils.htmlForCell(dimension_object_text);
                        	var dimension_name_text = LookerCharts.Utils.textForCell(dimension_object_text);
				if(queryResponse.fields.measures.length == 1){
					var measure_object_one = row[queryResponse.fields.measures[0].name];
					var measure_value_one = measure_object_one.value;
					sets.push([dimension_name_date,dimension_name_text,measure_value_one]);	
				}			
				if(queryResponse.fields.table_calculations.length == 1){ 
					var tablecalc_object_one = row[queryResponse.fields.table_calculations[0].name];
					var tablecalc_value_one = tablecalc_object_one.value;
					sets.push([dimension_name_date,dimension_name_text,tablecalc_value_one]);
				}
			} else {
				if(queryResponse.fields.measures.length == 1){
					var obj = row[queryResponse.fields.measures[0].name];
					for (var property in obj) {
                                                sets.push([dimension_name_date,property,obj[property].value]);
                                        }
				}
	                	if(queryResponse.fields.table_calculations.length == 1){
					var obj = row[queryResponse.fields.table_calculations[0].name];
					for (var property in obj) {
						sets.push([dimension_name_date,property,obj[property].value]);
					}
				}
			}
		}

		//Get unique dimension keys
		var dims = [];
		sets.forEach(function(val){
			if(dims.length == 0){
				dims.push(val[1]);
			} else {
				var found = false;
				dims.forEach(function(dim){
					if(dim == val[1]){
						found = true;
					}
				});
				if(!found){
					dims.push(val[1]);
				}
			}
		});

		//Test if the svg is already created. If so, remove it
		//This is done to refresh the imaage after every update
		if(!d3.selectAll("#" + visId + " > svg").empty()){
			d3.selectAll("svg").remove(); 
		}

		var data = sets;

		var margin = {top: 10, right: 50, bottom: 50, left: 70},
	   	    width = $(element)[0].clientWidth - margin.left - margin.right,
	    	    height = $(element)[0].clientHeight - margin.top - margin.bottom;


		/* 
		 * value accessor - returns the value to encode for a given data object.
		 * scale - maps value to a visual display encoding, such as a pixel position.
		 * map function - maps from data value to display value
		 * axis - sets up axis
		 */ 

		// setup x 
		var xValue = function(d) { return type(d[0]); }, // data -> value
		    xScale = d3.time.scale().range([0, width]), // value -> display
		    xAxis = d3.svg.axis().scale(xScale);

		// setup y
		var yValue = function(d) { return d[2]; }, // data -> value
		    yScale = d3.scale.linear().range([height, 0]), // value -> display
		    yAxis = d3.svg.axis().scale(yScale).orient("left");

		// An area generator, for the light fill.
		var area = d3.svg.area()
    		    .interpolate("monotone")
    		    .x(function(d) { return xScale(type(d[0])); })
    		    .y0(height)
    		    .y1(function(d) { return yScale(d[2]); });

		// A line generator, for the dark stroke.
		var line = d3.svg.line()
    		    .interpolate("monotone")
    		    .x(function(d) { return xScale(type(d[0])); })
    		    .y(function(d) { return yScale(d[2]); });

		// add the graph canvas to the body of the webpage
		var svg = d3.select("#" + visId).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		    .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// add the tooltip area to the webpage
		//var tooltip = d3.select("body").append("div")
		//    .attr("class", "tooltip")
		//    .style("opacity", 0);

		// don't want dots overlapping axis, so add in buffer to data domain
		if(config.xCustomStart){
			xScale.domain([config.xCustomStartValue, d3.max(data, xValue)]);
		} else {
			xScale.domain([d3.min(data, xValue), d3.max(data, xValue)]);
		}
		if(config.yCustomStart){
			yScale.domain([config.yCustomStartValue, d3.max(data, yValue)+1]);
		} else {
			yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);
		}

		// Add the clip path.
  		svg.append("clipPath")
      		    .attr("id", "clip")
    		    .append("rect")
      		    .attr("width", width)
      		    .attr("height", height);

		// x-axis
		svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(xAxis)
		    .append("text")
		    .attr("class", "label")
		    .attr("x", width)
		    .attr("y", -2)
		    .attr("dy", "-.6em")
		    .style({"text-anchor":"end","stroke-width":"1px"})
		    .text(config.xAxisLabel);

 		// y-axis
		svg.append("g")
		    .attr("class", "y axis")
		    .call(yAxis)
		    .append("text")
		    .attr("class", "label")
		    .attr("transform", "rotate(-90)")
		    .attr("y", 6)
		    .attr("dy", ".71em")
		    .style("text-anchor", "end")
		    .text(config.yAxisLabel);

		// add the X gridlines	
		if(config.xGridLines){
                	d3.selectAll("g.x g")
                  	  .append("line")
                  	  .attr("class", "gridline")
                  	  .attr("x1", 0)
                  	  .attr("y1", -height)
                  	  .attr("x2", 0)
                  	  .attr("y2", 0);
		}

		// add the Y gridlines
		if(config.yGridLines){
			d3.selectAll("g.y g") 
    		  	  .append("line") 
    		  	  .attr("class", "gridline")
    		  	  .attr("x1", 0) 
    		  	  .attr("y1", 0)
    		  	  .attr("x2", width)
    		  	  .attr("y2", 0);
		}

		var dimData = [];
		dims.forEach(function(dim){
			var values = data.filter(function(d) {
    					return d[1] == dim;
  				     });
			dimData.push(values);
		});
		
		// set colors
		var colors = d3.scale.category10();
  		svg.selectAll('.line')
    		    .data(dimData)
    		    //.data([values,msft,ibm])
    		    .enter()
      			.append('path')
        		.attr('class', 'line')
        		.style('stroke', function(d) {
			    return colors(Math.random() * 100);
			})
        		.attr('clip-path', 'url(#clip)')
        		.attr('d', function(d) {
          		    return line(d);
        		})
			.attr('legend-val', function(d) {
                            return d[1][1];
                        })


		// Add 'curtain' rectangle to hide entire graph
  		var curtain = svg.append('rect')
    		    .attr('x', -1 * width)
    		    .attr('y', -1 * height)
    		    .attr('height', height)
    		    .attr('width', width)
    		    .attr('class', 'curtain')
    		    .attr('transform', 'rotate(180)')
    		    .style('fill', '#ffffff')

		// Create a shared transition for anything we're animating
  		var t = svg.transition()
    		    .delay(750)
    		    .duration(config.animationDuration)
    		    .ease('linear')
    		    .each('end', function() {
      			d3.select('line.guide')
        		.transition()
        		.style('opacity', 0)
        		.remove()
    		    });		
		
		t.select('rect.curtain')
    		    .attr('width', 0);
  		t.select('line.guide')
    		    .attr('transform', 'translate(' + width + ', 0)')

		//Legend
		var dotX = 0;
		$('.line').each(function(index){
				svg.append("circle").attr("cx",dotX).attr("cy",height + 40).attr("r", 6).style("fill", $(this).css('stroke'));
				svg.append("text").attr("x", dotX + 10).attr("y", height + 40).text($(this).attr('legend-val')).style("font-size", "10px").attr("alignment-baseline","middle")
				dotX += 110;
			});

		//tooltip
		/*
		tipBox = svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('opacity', 0)
    .on('mousemove', drawTooltip)
    .on('mouseout', removeTooltip);

		const tooltip = d3.select('#tooltip');
		const tooltipLine = svg.append('line');

		function removeTooltip() {
  			if (tooltip) tooltip.style('display', 'none');
  			if (tooltipLine) tooltipLine.attr('stroke', 'none');
		}

		function drawTooltip() {
  const year = Math.floor((xScale.invert(d3.mouse(tipBox.node())[0]) + 5) / 10) * 10;
  
  tooltipLine.attr('stroke', 'black')
    .attr('x1', xScale(year))
    .attr('x2', xScale(year))
    .attr('y1', 0)
    .attr('y2', height);
  
  tooltip.html(year)
    .style('display', 'block')
    .style('left', d3.event.pageX + 20)
    .style('top', d3.event.pageY - 20)
    .selectAll()
    .data(states).enter()
    .append('div')
    .style('color', d => d.color)
    .html(d => d[1] + ': ' + d[2]);
}

		// draw Images
		svg.selectAll(".dot")
		    .data(data)
	            .enter()
		    .append("image")
		    .attr("xlink:href", function(d){ return d[1]; })
		    .attr("x", xMap)
  		    .attr("y", yMap)
  		    .attr("width", config.imageWidth)
  		    .attr("height", config.imageHeight)	
		    .on("mouseover", function(d) {
			tooltip.transition()
			     .duration(200)
			     .style("opacity", .5);
			tooltip.html(d[0] + "<br/> (" + Math.round(xValue(d)) 
				+ ", " + Math.round(yValue(d)) + ")")
			     .style("left", (d3.event.pageX + 5) + "px")
			     .style("top", (d3.event.pageY - 28) + "px");
		    })
		    .on("mouseout", function(d) {
			 tooltip.transition()
			     .duration(500)
			     .style("opacity", 0);
		    });
*/
	}
});

var idNum = 0;

function type(d) {
  return parse(d);
}

var parse = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
