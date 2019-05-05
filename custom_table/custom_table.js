looker.plugins.visualizations.add({
	id: "custom-table",
	label: "Custom Table",
	options: {
		title: {
			label: "Title",
			type: "boolean",
			default: true,
			section: " Title",
			order: 1
		},
		titleText: {
			label: "Title Text",
			type: "string",
			default: "Title",
			section: " Title",
			order: 2
		},
		titleTextSize: {
                        label: "Title Text Size",
                        type: "string",
                        default: "12px",
                        section: " Title",
                        order: 3
                },
		titleTextColor: {
			label: "Text Color",
			type: "array",
			display: "colors",
			default: ["white"],
			section: " Title",
			order: 4
		},	
		titleBackgroundColor: {
			label: "Background Color",
			type: "array",
			display: "colors",
			default: ["#002e6d"],
			section: " Title",
			order: 5
		},
		subtitle: {
			label: "Subtitle",
                        type: "boolean",
                        default: false,
                        section: "Subtitle",
                        order: 1
		},
		subtitleCols: {
			label: "Subtitle Columns",
			type: "string",
			default: "2",
			section: "Subtitle",
			order: 2
		},
		subtitleText: {
                        label: "Title Text",
                        type: "string",
                        default: "Col1|Col2",
			section: "Subtitle",
                        order: 3
                },
                subtitleTextSize: {
                        label: "Title Text Size",
                        type: "string",
                        default: "12px",
                        section: "Subtitle",
                        order: 4
                },
                subtitleTextColor: {
                        label: "Text Color",
                        type: "array",
                        display: "colors",
                        default: ["black"],
                        section: "Subtitle",
                        order: 5
                },
                subtitleBackgroundColor: {
                        label: "Background Color",
                        type: "array",
                        display: "colors",
                        default: ["#fcf2c0"],
                        section: "Subtitle",
                        order: 6
                }
	},

	create: function(element,config) {
		this._textElement = element.appendChild(document.createElement("div")).setAttribute("class","parentGrid");
	},

	update: function(data, element, config, queryResponse){
		//Allow multiple grids on a dashboard
		
	/*	element.innerHTML = `<style>
    				.ag-row-group {
        				font-weight: bold;
    				}
			</style>`;
		*/
		$('.parentGrid').remove();	
		// Create an element to contain the text.

		//this._textElement = element.appendChild(document.createElement("div")).setAttribute("class","myGrid");
		this._textElement = element.appendChild(document.createElement("div")).setAttribute("class","parentGrid");
		$('.parentGrid').width('100%');
                $('.parentGrid').height('100%');

		//var rand = Math.floor(Math.random() * 1000000);
		$('.parentGrid').append('<div class="myGrid"><table class="myTable" style="width:100%"></table></div>');
		$('.myGrid').width('100%');
		$('.myGrid').height('100%');

		//InitCap function
                String.prototype.initCap = function () {
                      return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
                      return m.toUpperCase();
                      });
                }

		var subtitleCols = config.subtitleCols;
		if(config.title){
			$('.myTable').append('<tr style="background-color:' + config.titleBackgroundColor  + ';"><th style="text-align:center;color:' + config.titleTextColor  +';font-size:' + config.titleTextSize  + ';" colspan=' + subtitleCols  + '>' + config.titleText + '</th></tr>');
		}
		var subtitleArray = config.subtitleText.split('|');
		if(config.subtitle){
			$('.myTable').append('<tr class="subtitleTable" style="background-color:' + config.subtitleBackgroundColor  + ';"></tr>');
		}
		for(var i=1;i<=subtitleCols;i++){
			$('.subtitleTable').append('<td style="text-align:center;color:' + config.subtitleTextcolor + ';">' + subtitleArray[i-1]  + '</td>');
		}

		if(data.length > 0){
			var headerLabels = [];
			queryResponse.fields.dimensions.forEach(function(dimension){
				headerLabels.push(dimension.label_short);
			});
			queryResponse.fields.measures.forEach(function(measure){
                                headerLabels.push(measure.label_short);
                        });

			headerLabels.forEach(function(header){
			});

			var rowData = [];
			//Get Data
			for(var row of data){
			};

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
