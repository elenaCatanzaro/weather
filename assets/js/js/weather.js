var search_terms ;
var json_obj;

function search_city(){
	let link = '/w/city/';
	value = document.getElementById(`main-search`).value;
	console.log(value);
	form = document.getElementById("search-form");
	form.action = (link  + value );
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
			list += "<li><a href='w/city/"+ terms[i].city.replace(" ", "_") +"'>" + terms[i].city + ", " + terms[i].country + "</a></li>";
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

function hideResults( e ){
	console.log(e);
	let res = document.getElementById("result");
	res.style.visibility = "hidden";
	res.overflowY = "hidden";
}

function showResults(){
	let res = document.getElementById("result");
	res.style.visibility = "visible";
	res.overflowY = "auto";
}

async function send_suggestion( e ){
	console.log("entra");
	let button = document.getElementById('btn-submit');
	button.addEventListener('click', async function(e) {

	e.preventDefault();
	console.log("prevented");
	let toSend = document.getElementById('city-input-form').value;

	if( toSend.length == 0 )
		return;

	console.log(toSend);
	toSend = toSend.replace(" ", "_");
	let btn = document.getElementById('btn-submit');
	let load = document.createElement('div');
	load.className="spinner-border text-primary";
	load.setAttribute('role','status');
	load.id = "loading";
	let span = document.createElement('span');
	span.classList = 'visually-hidden';
	span.innerText = "Loading...";
	load.appendChild(span);
	btn.style.display = 'none';
	let parent = btn.parentNode;
	parent.appendChild(load);
	await fetch("/suggest/" + toSend, 
	{ 	method: 'POST',
		headers: {
				'Content-type': 'application/json'
				}
	});
	console.log("done sending");
	document.getElementById('loading').remove();
	btn.style.display = 'inline-block';
	parent.appendChild(document.createTextNode('Sent!'));

	setTimeout(()=>{
			let form = document.getElementById('new_city_form');
			form.lastChild.remove();
		}, 3000);
	});

	
}

document.body.onload = function() {
	responsive_menu();
	send_suggestion();

};
