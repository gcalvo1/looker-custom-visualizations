looker.plugins.visualizations.add({
	id: "ag_grid",
	label: "ag-Grid",
	options: {
		theme: {
			label: "Theme",
			type: "string",
			display: "select",
			values: [{"Balham":"ag-theme-balham"},{"Dark":"ag-theme-dark"},{"Blue":"ag-theme-blue"},{"Material":"ag-theme-material"},{"Bootstrap":"ag-theme-bootstrap"}],
			default: "Balham",
			section: " Display",
			order: 1
		},
		filterable: {
			label: "Filterable",
			type: "boolean",
			default: true,
			section: " Display",
			order: 2
		},
		sortable: {
			label: "Sortable",
			type: "boolean",
			default: true,
			section: " Display",
			order: 3
		},
                resizable: {
                        label: "Resizable",
                        type: "boolean",
                        default: true,
			section: " Display",
                        order: 4
                },
		groupable: {
			label: "Groupable",
                        type: "boolean",
                        default: true,
			section: "Row Grouping",
                        order: 1		
		},
                gde: {
                        label: "Group by Default",
                        type: "boolean",
                        default: true,
			section: "Row Grouping",
                        order: 2
                },
                rowGroupLabel: {
                        label: "Group Label",
                        type: "string",
                        default: "",
                        section: "Row Grouping",
                        order: 3
                },
		columnHeader: {
			label: "Column Headers",
                        type: "boolean",
                        default: false,
                        section: "Column Headers",
                        order: 3
		},
		columnGroupNames: {
			label: "Column Group Names",
			type: "string",
			default: "",
			placeholder: "Group1,Group2,Group3,etc...",
			section: "Column Headers",
			order: 2
		},
		columnGroupNumbers: {
                        label: "Column Group Numbers",
                        type: "string",
                        default: "",
                        placeholder: "1,2|3,4,5|6",
                        section: "Column Headers",
                        order: 3
                },
	},
	create: function(element,config) {
		// Create a container element to let us center the text.
		element.innerHTML = `<style>
    				.ag-row-group {
        				font-weight: bold;
    				}
			</style>`
		element.setAttribute("id","parentGrid");
		//element.setAttribute("class","ag-theme-balham");		

		// Create an element to contain the text.
  		this._textElement = element.appendChild(document.createElement("div")).setAttribute("id","myGrid");
		$('#myGrid').addClass('ag-theme-balham');

		$('head').append(`
                        <script src="./ag_grid_enterprise.js"></script>
                        <link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-grid.css">
                        <link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-balham.css">
                	<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-dark.css">
			<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-blue.css">
			<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-material.css">
			<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-bootstrap.css">
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
		var headerCount = 0;
		var measureCount = queryResponse.fields.measures.length;
		var measureStartCol = headers.length - measureCount;
		
		if(config.columnHeader){
			//Get Column Names
			var groupNames = config.columnGroupNames.split(",");
			var groupNums = config.columnGroupNumbers.split("|");
			var numGroups = groupNames.length;
			var groupCount = 0;

			groupNames.forEach(function(group){
				var startCol = groupNums[groupCount].split(",")[0] - 1;
				if(groupCount < numGroups - 1){
					var endCol = groupNums[groupCount + 1].split(",")[0] - 1;
				} else {
					var endCol = headers.length;
				}			
				//Account for too large end value
				if(endCol > headers.length){
                                        endCol = headers.length;
                                }
				var children = [];
				for(var i=startCol;i < endCol;i++){
					var headerClean = headers[i].substr(headers[i].indexOf('.')+1).split("_").join(" ").initCap();
					children.push({ headerName: headerClean, field: headerClean, sortable: config.sortable, filter: config.filterable, valueFormatter: numberFormatter });
				}

				columnDefs.push({
					headerName: group,
					children: children
				});
				groupCount++;
			});
		} else {	
			//Get Column Names
			headers.forEach(function(header){
				var headerClean = header.substr(header.indexOf('.')+1).split("_").join(" ").initCap();
				//Add row group here
				if(headerCount == 0 && config.groupable){
					columnDefs.push(
                                		{ headerName: headerClean, 
						  field: headerClean, 
						  sortable: config.sortable, 
					  	  filter: config.filterable, 
						  valueFormatter: numberFormatter, 
						  rowGroup: true, 
						  hide: true });
	
				} else if(headerCount >= measureStartCol) {
						columnDefs.push(
							{ headerName: headerClean, 
						  	field: headerClean, 
						  	sortable: config.sortable, 
						  	filter: config.filterable,
						  	valueFormatter: numberFormatter, 
						  	aggFunc: 'sum' });
					} else {
						columnDefs.push(
                                                        { headerName: headerClean,
                                                        field: headerClean,
                                                        sortable: config.sortable,
                                                        filter: config.filterable,
                                                        valueFormatter: numberFormatter,
                                                        });						
					}
				headerCount++;
			});
		} 

		var rowData = [];

		//Get Data
		for(var row of data){
			var currObj = {};
			headers.forEach(function(header) {
				var headerClean = header.substr(header.indexOf('.')+1).split("_").join(" ").initCap();
				/*if(row[header].rendered){
					//uncomment when figure out grouping with commas
					currObj[headerClean] = row[header].rendered;
					//currObj[headerClean] = row[header].value;
				} else {
					currObj[headerClean] = row[header].value;
				}*/
				currObj[headerClean] = row[header].value;
			});
			rowData.push(currObj);			
		};

		var randId = "myGrid" +  Math.floor((Math.random() * 10000) + 1).toString();

		var body = d3.select('#parentGrid')
				.append('div')
				.attr('id',randId)
				.attr('class',config.theme)
				.style('width','100%')
				.style('height','100%');

    		// specify the data
		var expand = -1;
    		if(config.gde){
			expand = 0;
		}

		var firstHeaderClean = headers[0].substr(headers[0].indexOf('.')+1).split("_").join(" ").initCap();
		// let the grid know which columns and what data to use
    		var gridOptions = {
			groupSelectsChildren: true,
			groupDefaultExpanded: expand,
			autoGroupColumnDef: {
        			headerName: config.rowGroupLabel,
        			field: firstHeaderClean,
        			width: 250,
        			editable: false,
    			},
			defaultColDef: {
        			resizable: config.resizable
    			},
      			columnDefs: columnDefs,
      			rowData: rowData,
			animateRows: true,
			rowSelection: 'multiple',
			defaultGroupSortComparator: function(nodeA, nodeB) {
        			if (nodeA.key < nodeB.key) {
            				return -1;
        			} else if (nodeA.key > nodeB.key) {
            				return 1;
        			} else {
            				return 0;
        			}
    			},
    		};

  		// lookup the container we want the Grid to use
  		var eGridDiv = document.querySelector('#'+randId);
        
		//Set License Key
		agGrid.LicenseManager.setLicenseKey("Evaluation_License-_Not_For_Production_Valid_Until_25_April_2019__MTU1NjE0NjgwMDAwMA==5095db85700c871b2d29d9537cd451b3");
		// create the grid passing in the div to use together with the columns & data we want to use
		new agGrid.Grid(eGridDiv, gridOptions);

	}	
});

//Number formatter
function numberFormatter(params) {
	if(!isNaN(params.value)){
		return Math.floor(params.value).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	} else {
		return params.value;
	}
}


