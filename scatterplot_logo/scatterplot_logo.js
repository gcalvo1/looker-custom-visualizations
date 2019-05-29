looker.plugins.visualizations.add({
	id: "scatterplot-logo",
	label: "Scatterplot Logo",
	options: {
		imageWidth: {
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
		},
		xAxisLabel: {
			label: "x-Axis Label",
			type: "string",
			default: "",
			placeholder: "Label",
			section: "x-Axis",
			order: 0
		},
		xGridLines: {
                        label: "Grid Lines",
                        type: "boolean",
                        default: true,
                        section: "x-Axis",
                        order: 1
                },
		xMeanRefLine: {
                        label: "Mean Reference Line",
                        type: "boolean",
                        default: false,
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
		yGridLines: {
                        label: "Grid Lines",
                        type: "boolean",
                        default: true,
                        section: "y-Axis",
                        order: 1
                },
		yMeanRefLine: {
                        label: "Mean Reference Line",
                        type: "boolean",
                        default: false,
                        section: "y-Axis",
                        order: 2
                }
	},

	create: function(element, config) {
		idNum = Math.floor((Math.random() * 10000000) + 1);
		element.innerHTML = "";
		element.setAttribute("id","scatterplot-logo-" + idNum);
	},

	update: function(data, element, config, queryResponse) {
		
		//Get id for element
		var visId = $(element).attr('id');
		//Error Handling
		//Clear any errors from previos updates
		this.clearErrors();

		if (queryResponse.fields.dimensions.length !== 2) {
     			this.addError({title: "Incorrect Number of Dimensions", message: "This chart requires 2 dimensions."});
      			return;
    		}
		if (queryResponse.fields.measures.length != 2 && queryResponse.fields.table_calculations.length != 2) {
     			this.addError({title: "Incorrect Number of Measures", message: "This chart requires 2 measures or 2 table calculations."});
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

			.dot {
			  stroke: #000;
			}

			.gridline {
  			  stroke: #F5F5F5 !important;
  			  stroke-opacity: 0.7;
  			  shape-rendering: crispEdges;
			}

			.grid path {
  			  stroke-width: 0.5;
			}

			.tooltip {
			  position: absolute;
			  width: 100px;
			  height: 32px;
			  background-color: black;
			  color: white;
			  padding-left: 5px;
			  border-radius: 5px;
			  pointer-events: none;
			}

			.refline {
  			  fill: none;
  			  stroke: #2F4F4F;
        		  stroke-width: 1.0px;
        		  stroke-dasharray: 5,15;
    			}
		</style>`

		//Create asscciate arrays
		var sets = [],
		    ySum = 0,
		    xSum = 0;
		for(var row of data){
			var set = [];
			var dimension_object_text = row[queryResponse.fields.dimensions[0].name];
			var dimension_html_text = LookerCharts.Utils.htmlForCell(dimension_object_text);
			var dimension_name_text = LookerCharts.Utils.textForCell(dimension_object_text);
			var dimension_object_logo = row[queryResponse.fields.dimensions[1].name];
                        var dimension_html_logo = LookerCharts.Utils.htmlForCell(dimension_object_logo);
                        var dimension_name_logo = LookerCharts.Utils.textForCell(dimension_object_logo);

			if(queryResponse.fields.measures.length == 2){
				var measure_object_one = row[queryResponse.fields.measures[0].name];
				var measure_value_one = measure_object_one.value;
				var measure_object_two = row[queryResponse.fields.measures[1].name];
                        	var measure_value_two = measure_object_two.value;
				xSum += measure_value_one;
                                ySum += measure_value_two;
				sets.push([dimension_name_text,dimension_name_logo,measure_value_one,measure_value_two]);	
			}			
			if(queryResponse.fields.table_calculations.length == 2){ 
				var tablecalc_object_one = row[queryResponse.fields.table_calculations[0].name];
                        	var tablecalc_value_one = tablecalc_object_one.value;
			        var tablecalc_object_two = row[queryResponse.fields.table_calculations[1].name];
                        	var tablecalc_value_two = tablecalc_object_two.value;
				xSum += tablecalc_value_one;
				ySum += tablecalc_value_two;
				sets.push([dimension_name_text,dimension_name_logo,tablecalc_value_one,tablecalc_value_two]);
			}
		}
		
		var xMean = xSum / data.length;
		var yMean = ySum / data.length;

		//Test if the svg is already created. If so, remove it
		//This is done to refresh the imaage after every update
		if(!d3.selectAll("#" + visId + " > svg").empty()){
			d3.selectAll("svg").remove(); 
		}

		var data = sets;
		
		var margin = {top: 20, right: 60, bottom: 70, left: 60},
	   	    width = $(element)[0].clientWidth - margin.left - margin.right,
	    	    height = $(element)[0].clientHeight - margin.top - margin.bottom;

		/* 
		 * value accessor - returns the value to encode for a given data object.
		 * scale - maps value to a visual display encoding, such as a pixel position.
		 * map function - maps from data value to display value
		 * axis - sets up axis
		 */ 

		// setup x 
		var xValue = function(d) { return d[2]; }, // data -> value
		    xScale = d3.scale.linear().range([0, width]), // value -> display
		    xMap = function(d) { return xScale(xValue(d));}, // data -> display
		    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

		//setup x reference line
		var xRefValue = function(d) { return d; },
		    xRefMap = function(d) { return xScale(xRefValue(d));}; 

		// setup y
		var yValue = function(d) { return d[3]; }, // data -> value
		    yScale = d3.scale.linear().range([height, 0]), // value -> display
		    yMap = function(d) { return yScale(yValue(d));}, // data -> display
		    yAxis = d3.svg.axis().scale(yScale).orient("left");

		//setup x reference line
                var yRefValue = function(d) { return d; },
                    yRefMap = function(d) { return yScale(yRefValue(d));};

		// add the graph canvas to the body of the webpage
		var svg = d3.select("#" + visId).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		    .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// add the tooltip area to the webpage
		var tooltip = d3.select("body").append("div")
		    .attr("class", "tooltip")
		    .style("opacity", 0);

		// don't want dots overlapping axis, so add in buffer to data domain
		xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
		yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

		// x-axis
		svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(xAxis)
		    .append("text")
		    .attr("class", "label")
		    .attr("x", width)
		    .attr("y", -2)
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

		/* horizontal reference line */
		if(config.xMeanRefLine){
                	svg.append("svg:line")
                    	  .data([yMean])
                    	  .attr("x1", 0)
                    	  .attr("y1", yRefMap)
                    	  .attr("x2", width)
                    	  .attr("y2", yRefMap)
                    	  .attr("class", "refline")
		}

		/* vertical reference line */
		if(config.yMeanRefLine){
			svg.append("svg:line")
  		    	  .data([xMean])
  		    	  .attr("x1", xRefMap)
  	 	    	  .attr("y1", 0)
  		    	  .attr("x2", xRefMap)
  		    	  .attr("y2", height)
  		    	  .attr("class", "refline")
		}
	
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
		    });// add the Y gridlines
                d3.selectAll("g.y g")
                  .append("line")
                  .attr("class", "gridline")
                  .attr("x1", 0)
                  .attr("y1", 0)
                  .attr("x2", width)
                  .attr("y2", 0);
	}
});

var idNum = 0;
