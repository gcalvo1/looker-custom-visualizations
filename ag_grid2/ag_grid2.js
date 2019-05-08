looker.plugins.visualizations.add({
	id: "hg_grid",
	label: "hg-Grid",
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
			order: 5
		},
		sortable: {
			label: "Sortable",
			type: "boolean",
			default: true,
			section: " Display",
			order: 6
		},
                resizable: {
                        label: "Resizable",
                        type: "boolean",
                        default: true,
			section: " Display",
                        order: 7
                },
                sizeColToFit: {
                        label: "Size Columns to Fit Screen",
                        type: "boolean",
                        default: false,
                        section: " Display",
                        order: 8
                },
                rowDrag: {
                        label: "Row Drag",
                        type: "boolean",
                        default: false,
                        section: " Display",
                        order: 9
                },
		jsonParse: {
			label: "JSON Parse",
			type: "boolean",
			default: "false",
			section: " Display",
			order: 10
		},
		groupable: {
			label: "Groupable",
                        type: "boolean",
                        default: false,
			section: "Row Grouping",
                        order: 1		
		},
                gde: {
                        label: "Group by Default",
                        type: "boolean",
                        default: false,
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
                columnPin: {
                        label: "Pinned Columns",
                        type: "string",
                        default: "",
			placeholder: "2",
                        section: "Column Headers",
                        order: 1
                },
		columnHeader: {
			label: "Column Headers",
                        type: "boolean",
                        default: false,
                        section: "Column Headers",
                        order: 3
		},
		autoSizeColumns: {
			label: "Auto-Size Columns",
			type: "boolean",
			default: true,
			section: "Column Headers",
			order: 6
		},
		sizeColToFit: {
                        label: "Size Columns to Fit Screen",
                        type: "boolean",
                        default: false,
                        section: "Column Headers",
                        order: 5
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
		var rand = Math.floor(Math.random() * 1000000);
		this._textElement = element.appendChild(document.createElement("div")).setAttribute("class","parentGrid");
	},

	update: function(data, element, config, queryResponse){
		//Allow multiple grids on a dashboard
		var classRand = 0,
		    found = false;
		
		$('div').each(function(){
			if($(this).attr('class')){
				if($(this).attr('class').match(/myGrid/) && !found){
                                        classRand = $(this).attr('class').split('-')[1].split(' ')[0];
					found = true;
				} else if( $(this).attr('class').match(/parentGrid/)) {
						classRand = $(this).attr('class').split('-')[1];
   					}
			}
		});

		element.innerHTML = `<style>
    				.ag-row-group {
        				font-weight: bold;
    				}
			</style>`;

		$('.parentGrid').remove();	
		// Create an element to contain the text.

		//this._textElement = element.appendChild(document.createElement("div")).setAttribute("class","myGrid");
		this._textElement = element.appendChild(document.createElement("div")).setAttribute("class","parentGrid");
		$('.parentGrid').width('100%');
                $('.parentGrid').height('100%');

		//var rand = Math.floor(Math.random() * 1000000);
		$('.parentGrid').append('<div class="myGrid"></div>');
		$('.myGrid').addClass(config.theme);
		$('.myGrid').width('100%');
		$('.myGrid').height('100%');

		$('head').append('<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-grid.css">');
		$('head').append('<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-balham.css">');
		$('head').append('<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-dark.css">');
		$('head').append('<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-blue.css">');
		$('head').append('<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-material.css">');
		$('head').append('<link rel="stylesheet" href="https://unpkg.com/ag-grid-community/dist/styles/ag-theme-bootstrap.css">');

		//InitCap function
                String.prototype.initCap = function () {
                      return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
                      return m.toUpperCase();
                      });
                }

		if(data.length > 0){
			var headerLabels = [];
			queryResponse.fields.dimensions.forEach(function(dimension){
				headerLabels.push(dimension.label_short);
			});
			queryResponse.fields.measures.forEach(function(measure){
                                headerLabels.push(measure.label_short);
                        });

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
					var pinCols = config.columnPin;
					var headerClean = header.substr(header.indexOf('.')+1).split("_").join(" ").initCap();
					var rowDrag = false;
					var pinDir = false;
					var jsonField = false;
					var value = data[0][header].value;
					if(value != null && (typeof value === 'string' || value instanceof String) && config.jsonParse){
						if(value.substring(0,2) == '{"'){
							var obj = JSON.parse(value);
							//Remove bill to and ship to properties
							for(var i in obj) {
								var propertyShort = i.substring(0,8);
								if(propertyShort == 'bill_to_' || propertyShort == 'ship_to_' || i == "shipping_same_as_billing"){
									delete obj[i];
								}
							}
							//Sort JSON Parsed Object
							var sorted = {},
							key, a = [];
							for (key in obj) {
								if (obj.hasOwnProperty(key)) {
									a.push(key);
								}
							}
							a.sort();
							for (key = 0; key < a.length; key++) {
								sorted[a[key]] = obj[a[key]];
							}
							objKeys = Object.keys(sorted),
							jsonField = true;
						}
					}

					if(jsonField && config.jsonParse){
						objKeys.forEach(function(key){
							columnDefs.push(
								{ headerName: key,
								  field: key,
								  sortable: config.sortable,
								  filter: config.filterable,
								  rowGroup: config.groupable 
								});
						});
						headerCount++;
					}
					else { if(headerCount == 0 && config.rowDrag){
							rowDrag = true;
						}
						if(headerCount <= pinCols - 1){
							pinDir = 'left';
						}

						if(headerCount == 0 && config.groupable){
							//Measure
							if(data[0][header].rendered){
								columnDefs.push(
									{ headerName: headerLabels[headerCount], 
									  field: headerClean, 
									  sortable: config.sortable, 
									  filter: config.filterable, 
									  valueFormatter: numberFormatter, 
									  rowDrag: rowDrag,
									  rowGroup: false, 
									  hide: false });
							} else {
							//Dimensions
								columnDefs.push(
									{ //headerName: headerClean,
								   	  headerName: headerLabels[headerCount],
									  field: headerClean,
									  sortable: config.sortable,
									  filter: config.filterable,
									  rowDrag: rowDrag,
									  rowGroup: true,
									  hide: true });
							}
			
						} else if(headerCount >= measureStartCol) {
								columnDefs.push(
									{ //headerName: headerClean, 
									headerName: headerLabels[headerCount],
									field: headerClean, 
									sortable: config.sortable, 
									filter: config.filterable,
									rowDrag: rowDrag,
									pinned: pinDir,
									valueFormatter: numberFormatter, 
									aggFunc: 'sum' });
							} else {
								columnDefs.push(
									{ //headerName: headerClean,
									headerName: headerLabels[headerCount],
									field: headerClean,
									sortable: config.sortable,
									filter: config.filterable,
									rowDrag: rowDrag,
									pinned: pinDir,
									//valueFormatter: numberFormatter,
									});						
							}
						headerCount++;
					}
				});
			}

			var rowData = [];
			var exportFileName = '';
			//Get Data
			for(var row of data){
				var currObj = {};
				var headerCount = 0;
				headers.forEach(function(header) {
					var value = row[header].value;
					jsonField = false;
					if(value != null && (typeof value === 'string' || value instanceof String)){
						if(value.substring(0,2) == '{"'){
							var obj = JSON.parse(value);
							var objKeys = Object.keys(obj);
							var objVal = Object.values(obj);
							jsonField = true;
						}
					}
					
					if(jsonField && config.jsonParse){
						var count = 0;
						objKeys.forEach(function(key){
							currObj[key] = objVal[count];
							count++;
						});
					} else {

						var headerClean = header.substr(header.indexOf('.')+1).split("_").join(" ").initCap();
						if(row[header].rendered){
							if(row[header].rendered.charAt(0) == '$' || row[header].rendered.charAt(1) == '$' ){
								currObj[headerClean] = row[header].rendered;	
							} else {
								currObj[headerClean] = row[header].value;
							}
						} else {
							if(headerCount == 0){
								exportFileName = row[header].value;
							}
							currObj[headerClean] = row[header].value;
						}
					}
					headerCount++;
				});
				rowData.push(currObj);
			};

			var today = new Date();
			var dd = String(today.getDate()).padStart(2, '0');
			var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
			var yyyy = today.getFullYear();
			today = yyyy + '-' + mm + '-' + dd;
			exportFileName = exportFileName + '_' + today;
			// specify the data
			var expand = -1;
			if(config.gde){
				expand = 0;
			}

			var firstHeaderClean = headers[0].substr(headers[0].indexOf('.')+1).split("_").join(" ").initCap();
			//var firstHeaderClean = columnDefs[0].headerName;
			
			// let the grid know which columns and what data to use
			var gridOptions = {
				onGridReady: function() {
                			var allColumnIds = [];
					gridOptions.columnApi.getAllColumns().forEach(function(column) {
        					allColumnIds.push(column.colId);
    					});
					if(config.autoSizeColumns){
    						gridOptions.columnApi.autoSizeColumns(allColumnIds);	
					} else if(config.sizeColToFit){
						gridOptions.api.sizeColumnsToFit();
					}
				},
				groupSelectsChildren: true,
				groupDefaultExpanded: expand,
				autoGroupColumnDef: {
					headerName: config.rowGroupLabel,
					//field: firstHeaderClean,
					//width: 250,
					editable: false,
				},
				defaultColDef: {
					resizable: config.resizable
				},
				columnDefs: columnDefs,
				rowData: rowData,
				animateRows: true,
				multiSortKey: 'ctrl',
				rowSelection: 'multiple',
				enableRangeSelection: true,
				rowDragManaged: true,
				suppressAggFuncInHeader: true,
				//groupRemoveLowestSingleChildren: true,
				getContextMenuItems: function (params) {
    					var result = [
					'copy',
					'copyWithHeaders',
					'separator',
        				{
            					name: 'CSV Export',
            					action: function() {
                					var params = {
                        					fileName: exportFileName
                					};
                					gridOptions.api.exportDataAsCsv(params);
            					},
						icon: '<img src="https://png.pngtree.com/svg/20170726/5b0546bf9c.png" width="16px"/>'
        				}];
    					return result;
				},
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

			//var numGrids = $('.myGrid').length-1;
			// lookup the container we want the Grid to use
			var eGridDiv = document.querySelectorAll('.myGrid')[0];
		
			//Set License Key
			agGrid.LicenseManager.setLicenseKey("Evaluation_License-_Not_For_Production_Valid_Until_25_April_2019__MTU1NjE0NjgwMDAwMA==5095db85700c871b2d29d9537cd451b3");
			// create the grid passing in the div to use together with the columns & data we want to use
			new agGrid.Grid(eGridDiv, gridOptions);
		}
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

function sizeColumnsToFit(params) {
    params.api.sizeColumnsToFit();
}
