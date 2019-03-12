looker.plugins.visualizations.add({
	id: "ag_grid",
	label: "ag-Grid",
	options: {
		theme: {
			label: "Theme",
			type: "string",
			default: "ag-theme-balham",
			order: 1
		},
		filterable: {
			label: "Filterable",
			type: "boolean",
			default: true,
			order: 2
		},
		sortable: {
			label: "Sortable",
			type: "boolean",
			default: true,
			order: 3
		}
	},
	create: function(element,config) {

		// Create a container element to let us center the text.
 		var container = element.appendChild(document.createElement("div"));
		//var g = document.createElement("div");
		//g.id = "grid-container";
  		//container.setAttribute("id","grid-container");

		// Create an element to contain the text.
  		this._textElement = container.appendChild(document.createElement("div"));
		$('head').append(`
                        <script src="./ag_grid_src.js"></script>
                        <link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-grid.css">
                        <link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-balham.css">
                `);
	
	},

	update: function(data, element, config, queryResponse){

		if(!d3.selectAll("#myGrid").empty()){
			d3.selectAll("#myGrid").remove(); 
		}

		 //InitCap function
                String.prototype.initCap = function () {
                      return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
                      return m.toUpperCase();
                      });
                }

		var columnDefs = [];
		var headers = Object.keys(data[0]);

		//Get Column Names
		headers.forEach(function(header){
			var headerClean = header.substr(header.indexOf('.')+1).split("_").join(" ").initCap();
				columnDefs.push(
					{ headerName: headerClean, field: headerClean, sortable: config.sortable, filter: config.filterable }
				)
		}); 

		var rowData = [];

		//Get Data
		for(var row of data){
			var currObj = {};
			headers.forEach(function(header) {
				var headerClean = header.substr(header.indexOf('.')+1).split("_").join(" ").initCap();
				if(row[header].rendered){
					currObj[headerClean] = row[header].rendered;
				} else {
					currObj[headerClean] = row[header].value;
				}
			});
			rowData.push(currObj);			
		};

		//var css = element.innerHTML = `

  		//	<div id="myGrid" style="height: 100%;width:100%;" class="ag-theme-balham"></div>
		//`;

		var body = d3.select('.vis-container')
				.append('div')
				.attr('id','myGrid')
				.attr('class',config.theme)
				.style('width','100%')
				.style('height','100%');

		var headScript = document.createElement("headScript");
		headScript.src = "https://unpkg.com/ag-grid-community/dist/ag-grid-community.min.noStyle.js";
		document.body.appendChild(headScript);

		// specify the columns
    		//var columnDefs = [
      		//	{headerName: "Make", field: "make", sortable: config.sortable, filter: config.filterable },
    		//];

    		// specify the data
    		//var rowData = [
      		//	{make: "Toyota", model: "Celica", price: 35000},
    		//];

    		
		// let the grid know which columns and what data to use
    		var gridOptions = {
      			columnDefs: columnDefs,
      			rowData: rowData
    		};

  		// lookup the container we want the Grid to use
  		var eGridDiv = document.querySelector('#myGrid');
        
		// create the grid passing in the div to use together with the columns & data we want to use
		new agGrid.Grid(eGridDiv, gridOptions);

	}
});
