looker.plugins.visualizations.add({
	id: "boxplot",
	label: "Boxplot MLB",
    options: {
        boxColors: {
            label: "Box Colors",
            type: "array",
            default: ["#1f77b4", "#ff7f0e", "#2ca02c"],
            display: "colors",
        section: "Formatting"
        },
        boxFillColors: {
            label: "Box Fill Colors",
            type: "array",
            default: ["#FFFFFF", "#FFFFFF", "#FFFFFF"],
            display: "colors",
        section: "Formatting"
        },
        showLegend: {
            label: "Show Legend",
            type: "boolean",
            default: true,
        section: "Formatting",
        order: 1
        },
        xAxisName: {
            label: "Axis Name",
            section: "X Axis",
            type: "string",
            placeholder: "Provide an axis name ..."
        },
        yAxisName: {
            label: "Axis Name",
            section: "Y Axis",
            type: "string",
            placeholder: "Provide an axis name ..."
        },
        yAxisMinValue: {
            label: "Min value",
            default: null,
            section: "Y Axis",
            type: "number",
            placeholder: "Any number",
            display_size: "half",
        },
        yAxisMaxValue: {
            label: "Max value",
            default: null,
            section: "Y Axis",
            type: "number",
            placeholder: "Any number",
            display_size: "half",
        },
        yAxisLabelFormat: {
            label: "Label Format",
            default: "",
            section: "Y Axis",
            type: "string",
            placeholder: "$",
        }
    },

    create: function(element,config) {
		element.innerHTML = "";
	},

	update: function(data, element, config, queryResponse){
        // Invalid data structure error handling
        if (!handleErrors(this, queryResponse, {
            min_pivots: 0, max_pivots: 1,
            min_dimensions: 1, max_dimensions: 1,
            min_measures: 5, max_measures: 5,
        })) return;        

        let measures = queryResponse.fields.measure_like;

        // Extract dimension data and measure names
        let dim = queryResponse.fields.dimension_like[0];
        let minMeasureName = queryResponse.fields.measure_like[0].name;
        let q25MeasureName = queryResponse.fields.measure_like[1].name;
        let medMeasureName = queryResponse.fields.measure_like[2].name;
        let q75MeasureName = queryResponse.fields.measure_like[3].name;
        let maxMeasureName = queryResponse.fields.measure_like[4].name;
        
        let categories = [];
        // Get array of x axis categories
        data.forEach(function(row){
            categories.push(row[dim.name].value);
        });

        let series = [];
        let pivotCount = 0;
        // If there is a pivot create stacked series
        if(queryResponse.pivots) {            
            //Loop through pivots to create stacks
            queryResponse.pivots.forEach(function(pivot) {
                dataArray = [];
                //loop through data to get the measures                
                data.forEach(function(row){
                    rowDataArray = [row[minMeasureName][pivot.key].value,
                        row[q25MeasureName][pivot.key].value,
                        row[medMeasureName][pivot.key].value,
                        row[q75MeasureName][pivot.key].value,
                        row[maxMeasureName][pivot.key].value];
                    dataArray.push(rowDataArray);
                });
                //Add the pivot name and associated measures to the series object
                series.push({
                    name: pivot.key,
                    data: dataArray,
                    fillColor: config.boxFillColors[pivotCount],
                    legendColor: config.boxFillColors[pivotCount]
                });
                pivotCount = pivotCount + 1;
            });
        } else {
            dataArray = [];
            //loop through data to get the measures                
            data.forEach(function(row){
                rowDataArray = [row[minMeasureName].value,
                    row[q25MeasureName].value,
                    row[medMeasureName].value,
                    row[q75MeasureName].value,
                    row[maxMeasureName].value];
                dataArray.push(rowDataArray);
            });
            //Add the pivot name and associated measures to the series object
            series.push({
                name: config.yAxisName,
                data: dataArray,
                fillColor: config.boxFillColors[0],
                legendColor: config.boxFillColors[0]
            });
        }

        // Set Chart Options
        let options = {
            colors: config.boxColors,
            credits: {
                enabled: false
            },
            chart: {type: "boxplot"},
            title: {text: ""},
            legend: {enabled: config.showLegend},

            xAxis: {
                type: dim.is_timeframe ? "datetime" : null,
                title: {
                    text: !config.xAxisName ? dim.label_short : config.xAxisName
                 },
                 categories: categories
            },

            yAxis: {
                min: config.yAxisMinValue,
                max: config.yAxisMaxValue,
                title: {
                    text: config.yAxisName
                },
                labels: {
                    formatter: function() {
                        if (this.value >= 0) {
                            return config.yAxisLabelFormat + this.value
                        } else {
                            return '-' + config.yAxisLabelFormat + (-this.value)
                        }
                    }
                }
            },

            series: series
        };

        //Add functionality to have the legend reflect the fill color instead of the outline color
        (function(H) {
            H.wrap(H.Legend.prototype, 'colorizeItem', function(proceed, item, visible) {
                var color = item.color;
                item.color = item.options.legendColor;
                proceed.apply(this, Array.prototype.slice.call(arguments, 1));
                item.color = color;
            });
        }(Highcharts));

        // Instanciate Box Plot Highchart
        let myChart = Highcharts.chart(element, options);
    }
});