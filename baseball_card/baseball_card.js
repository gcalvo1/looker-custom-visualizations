looker.plugins.visualizations.add({
	id: "baseball_card",
	label: "Baseball Card",

	create: function(element,config) {

		// Create a container element to let us center the text.
 		var container = element.appendChild(document.createElement("div"));
  		container.className = "card-container";

		// Create an element to contain the text.
  		this._textElement = container.appendChild(document.createElement("div"));
	
	},

	updateAsync: function(data, element, config, queryResponse){

		for(var row of data){

			var player_name_object = row[queryResponse.fields.dimensions[0].name],
	 	    	    player_name_html = LookerCharts.Utils.htmlForCell(player_name_object),
			    player_name_text = LookerCharts.Utils.textForCell(player_name_object).replace(/\s+/g, '-'),
			    player_logo_object = row[queryResponse.fields.dimensions[1].name],
			    player_logo_text = LookerCharts.Utils.textForCell(player_logo_object),
			    primary_team_color_object = row[queryResponse.fields.dimensions[2].name],
			    primary_team_color_text = LookerCharts.Utils.textForCell(primary_team_color_object),
			    secondary_team_color_object = row[queryResponse.fields.dimensions[3].name],
			    secondary_team_color_text = LookerCharts.Utils.textForCell(secondary_team_color_object),
			    tertiary_team_color_object = row[queryResponse.fields.dimensions[4].name],
			    tertiary_team_color_text = LookerCharts.Utils.textForCell(tertiary_team_color_object),
			    player_img_object = row[queryResponse.fields.dimensions[5].name],
			    player_img_text = LookerCharts.Utils.textForCell(player_img_object),
		 	    measure_one_object  = row[queryResponse.fields.measures[0].name],
			    measure_one_text = LookerCharts.Utils.textForCell(measure_one_object);
		}
	
		String.prototype.initCap = function () {
   			return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
      			return m.toUpperCase();
   			});
		}
	
		var measureName = queryResponse.fields.measures[0].name.replace(/_/g, ' ').split(".").pop().initCap();
 		var names = document.getElementsByClassName("looker-vis-context-title-link ");
		if(names.length > 0){
			names[data.length - 1].innerText = measureName + ": " + measure_one_text;
		}

		var css = element.innerHTML = `
			<style>
                .card-container {
                text-transform: uppercase;
                font-family: 'Roboto', sans-serif;
                }

                .card-`+ player_name_text + `{
                position: relative;
                height: 100%;
                width: 100%;
                border: 15px ` + primary_team_color_text  + ` solid;
                }
                .card-`+ player_name_text + `:before, .card-`+ player_name_text + `:after {
                content: '';
                }
                .card-`+ player_name_text + `:before {
                position: absolute;
                top: 0;
                left: 0;
                z-index: 8;
                border-top: 60px solid ` + primary_team_color_text  + `;
                border-right: 60px solid transparent;
                }
                .card-`+ player_name_text + `:after {
                position: absolute;
                top: 0;
                left: 0;
                z-index: 5;
                border-top: 62px solid black;
                border-right: 62px solid transparent;
                }
                .card-`+ player_name_text + ` .team_logo {
                position: absolute;
                z-index: 15;
                top: -8px;
                left: -8px;
                }
                .card-`+ player_name_text + ` .player {
                position: absolute;
                top: 0;
                left: 0;
                z-index: 2;
                height: 100%;
                width: 100%;
                border: 2px black solid;
                }
                .card-`+ player_name_text + ` figcaption {
                position: absolute;
		padding-top: 5px;
                bottom: -10px;
                right: 0;
                width: 66%;
                height: 34px;
                text-align: center;
                font-size: 100%;
                background: ` + secondary_team_color_text  +  ` ;
                border: 2px black solid;
                z-index: 10;
                }
                .card-`+ player_name_text + ` figcaption:before, .card-`+ player_name_text + ` figcaption:after {
                content: '';
                }
                .card-`+ player_name_text + ` figcaption:before {
                position: absolute;
                bottom: 32px;
                right: -2px;
                z-index: 18;
                border-bottom: 15px solid ` + primary_team_color_text  + `;
                border-left: 15px solid transparent;
                }
                .card-`+ player_name_text + ` figcaption:after {
                position: absolute;
                bottom: 32px;
                right: -2px;
                z-index: 15;
                border-bottom: 17px solid black;
                border-left: 17px solid transparent;
                }
            </style>
			
			<figure class="card-`+ player_name_text  +`">
                    		<img class="team_logo" src="` + player_logo_text  + `" />
                    		<img class="player" src="` + player_img_text  + `" />
                    		<figcaption class="name">` + player_name_html + `</figcaption>
                	</figure>
		`;	
	}
});
