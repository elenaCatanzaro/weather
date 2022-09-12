var search_terms ;
var json_obj;

const loading_card = `<div class="card" aria-hidden="true" id="loading">
 						<div class="card-body">
    						<h5 class="card-title placeholder-glow">
      							<span class="placeholder col-6"></span>
    						</h5>
	    					<p class="card-text placeholder-glow">
						      <span class="placeholder col-7"></span>
						      <span class="placeholder col-4"></span>
						      <span class="placeholder col-4"></span>
						      <span class="placeholder col-6"></span>
						      <span class="placeholder col-8"></span>
	    					</p>
    						<span class="placeholder col-8"></span>
  						</div>
					</div>`;

		document.body.onload = function() {
			load_cities();
			responsive_menu();
		};	

		async function add_city(){
			
			let city_id = document.getElementById('search-field').getAttribute("data-id");
			let showcase = document.getElementById('city-showcase');
			let insert = loading_card;


			if( showcase.getAttribute('data-empty') == 'true'){
        		showcase.innerHTML = insert;
        	} else {
        		showcase.innerHTML += insert;	
        	}
		

			const response = await fetch(
        			`/weather/${city_id}`,
        			{ 	method: 'GET',
        				headers: {
        					'Content-type': 'application/json'
        				}
        			});
        	let city = await response.json()
        	insert = create_card(city_id, city.city, city.temp, city.weather);
        	let loader = document.getElementById('loading').remove();
        	
        	if( showcase.getAttribute('data-empty') == 'true'){
        		showcase.innerHTML = insert;
        		showcase.setAttribute('data-empty', 'false');
        	} else {
        		showcase.innerHTML += insert;	
        	}
        	
			await fetch(
				`/user/add/${city_id}`, 
					{
			            method: 'POST',
			            headers: {
			                'Content-type': 'application/json'
		        	}
        	});
		}
		
		async function load_cities(){
			let showcase = document.getElementById('city-showcase');
			let insert = loading_card;
			showcase.innerHTML = insert;
			let cities = await fetch('/user/cities')
			cities = await cities.json();

		    insert = "";

		    document.getElementById('loading').remove();
			if( cities.length == 0 ) {
				insert = "<h4 id='default'>Add a city to view it here</h4>";
				showcase.innerHTML = insert;
				showcase.setAttribute('data-empty', 'true');
			} else {
				for( i =0; i<cities.length; i++ ){
					insert = create_card(cities[i]._id, cities[i].city, cities[i].temp, cities[i].weather );
					showcase.innerHTML += insert;
					insert = "";
				}	
			}
		}

		function create_card( id, name, temp, weather ){
			let card = `<div class="col">
							<div class="card bk-s" >
								<div class="card-body text-center">
									<div class="text-end">
										<button class="btn button-theme font" type="submit" title="Remove" onclick="remove(this,'${id}')">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
										<path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z"/>
										</svg>
										</button>
									</div>
									<h4 class="card-title"><a href="/w/uselog/city/${name.replace(" ","_")}">${name}</a></h4>
									<p class="card-text temp"> ${temp}°</p>
									<p class="card-text">${weather}</p>
								</div>
							</div>
						</div>`;
			return card;
		}

		async function remove( button, city ){
			let parent = button.closest('.col');
			parent.remove();
			let url = `/user/delete/${city}`;
			const response = await fetch(
				url, 
				{
		            method: 'DELETE',
		            headers: {
		                'Content-type': 'application/json'
		        }
        	});
        	let showcase = document.getElementById('city-showcase');
        	if( ! showcase.hasChildNodes() ){
        		let insert = "<h4 id='default'>Add a city to view it here</h4>";
        		showcase.setAttribute('data-empty', 'true');
        		showcase.innerHTML = insert;
        	}
		}
		
		
		function autocompleteMatch( input ){
			if( input == '')
				return [];
			var reg = new RegExp(input.toUpperCase());
			let filtered = [];
			console.log(json_obj[0]);
			for( i=0; i<json_obj.length; i++  ){
				if( json_obj[i].city.toUpperCase().match(reg))
					filtered.push(json_obj[i]);
			}
			return filtered;
		}

		async function loadResults(val){
			let res = document.getElementById("result");

			if( val.length >= 3 ){
				search_terms = await fetch('w/comp/'+val);
				json_obj = await search_terms.json();
				res.innerHTML = "";
				let list = '';
				let terms = autocompleteMatch(val);
				for( i=0; i<terms.length; i++ ){
					list += "<li onclick='fill(this,\""+ terms[i]._id +"\")'><a>" + terms[i].city + ", " + terms[i].country;
					list += "</a></li>";

				}
				list = "<ul>" + list + "</ul>";
				res.innerHTML = list;
				showResults();
			} else if(val.length == 0 ){
				console.log("lunghezza zero");
				res.innerHTML = "";

			} else {
				hideResults();
			}
			console.log(val.length);
		}

		function fill( element, id ){
			let input = document.getElementById('search-field');
			input.setAttribute( "data-id",id);
			input.value = element.innerText;
			hideResults();
		}

		function hideResults( e ){
			let res = document.getElementById("result");
			res.style.visibility = "hidden";
			res.overflowY = "hidden";
		}

		function showResults(){
			let res = document.getElementById("result");
			res.style.visibility = "visible";
			res.overflowY = "auto";
		}