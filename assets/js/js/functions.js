const THEME_LS = 'theme';
const API_KEY =  '';
const UNSPLAH_API_KEY = '';
const DEFAULT_HOME = 'img/home_default.jpg';

// resetto il tema salvato al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
	clearTheme();
	setTheme();
});

// creo il web worker 
var apiWorker = new Worker('../../js/js/worker.js');
setMainImage();
getMainCitiesTemperature();


apiWorker.onmessage = function(e){
	console.log('answer from web worker: ', e.data);
	imageData = e.data;

	const objectURL = URL.createObjectURL(imageData.blob)

	let home_background = document.getElementById('search');
	home_background.style.backgroundImage = `url(${objectURL})`;
	console.log('finshed');
}

function darkmode(){
	body = document.body;
	body.classList.toggle('dark-theme');
	saveTheme( body.classList.contains('dark-theme') );
}

function clearTheme(){
	if( localStorage.getItem(THEME_LS) != null ){
		old_theme = localStorage.getItem(THEME_LS);
		old_theme = JSON.parse(old_theme); 
		let timeDiff = (new Date().getTime() - old_theme.date)/1000;
		if( timeDiff > 10 ){
			localStorage.removeItem(THEME_LS);
		}
	}
}

function saveTheme( mode ){
	let saved = localStorage.getItem(THEME_LS);
	if( saved == null || (new Date().getTime() - JSON.parse(localStorage.getItem(THEME_LS)).date)/1000 > 10){
		let obj = {
				darkMode: mode, 
				date: new Date().getTime(),
			};	
		localStorage.setItem(THEME_LS, JSON.stringify(obj));
	}	
}

function setTheme(){
	if( localStorage.getItem(THEME_LS) != null ){
		let obj = JSON.parse(localStorage.getItem(THEME_LS));
		console.log(document.body);
		if( obj.darkMode ){
			if( document.body.classList.contains('light-theme')){
				document.body.classList.remove('light-theme');
			}
			document.body.classList.add('dark-theme')
		} else{
			if( document.body.classList.contains('dark-theme')){
				document.body.classList.remove('dark-theme');
			}
		}
	}
}

//TO DO: prendere il link dell'immagine con una grandezza minore quando stiamo 
// usanod devices più piccoli di un laptop

async function setMainImage(){
	//let unsplashURL = `https://api.unsplash.com/photos/random?&query=weather&orientation=landscape&client_id=${UNSPLAH_API_KEY}`;
	//let response = await fetch(unsplashURL)
  	//const json = await response.json()
  	let search = document.getElementById('search');
  	//unsplashURL = json.urls.raw + `&w=${search.offsetWidth}`;
  	let unsplashURLs = [];
  	unsplashURLs.push('https://images.unsplash.com/photo-1565803758124-2076307f4451?ixid=MnwzMjY0MTh8MHwxfHJhbmRvbXx8fHx8fHx8fDE2NTM2NDg1MDA&ixlib=rb-1.2.1');
  	unsplashURLs.push('https://images.unsplash.com/photo-1488812690953-601000f207e4?ixid=MnwzMjY0MTh8MHwxfHJhbmRvbXx8fHx8fHx8fDE2NTM2NDkzODQ&ixlib=rb-1.2.1');
  	unsplashURLs.push('https://images.unsplash.com/photo-1581059729226-c493d3086748?crop=entropy&cs=tinysrgb&fm=jpg&ixid=MnwzMjY0MTh8MHwxfHJhbmRvbXx8fHx8fHx8fDE2NTM2NDk0MTk&ixlib=rb-1.2.1&q=80&raw_url=true');
  	unsplashURLs.push('https://images.unsplash.com/photo-1562742940-e255567c00f3?ixid=MnwzMjY0MTh8MHwxfHJhbmRvbXx8fHx8fHx8fDE2NTM2NDk1MDU&ixlib=rb-1.2.1');
  	let unsplash = unsplashURLs[Math.floor(Math.random() * 4)] + "&w=" + search.offsetWidth;
  	console.log(search.offsetWidth);
	apiWorker.postMessage(unsplash);
}


async function get( url ){
	let response = await fetch( url, {method: 'GET'});	
	let jsonObj = await response.json();
	return jsonObj;
}

async function getMainCitiesTemperature(){
	elems = document.getElementsByClassName('card-city');
	temps = document.getElementsByClassName('card-temperature');
	for( let i = 0 ; i<elems.length; i++){
		city = elems[i].innerText;
		weather = await getWeatherFromName(city)
		temperature = Math.round(weather.main.temp);
		temps[i].innerText = temperature + '°';
		
	}	
}

async function getCoordFromName( name ){
	let URL = `http://api.openweathermap.org/geo/1.0/direct?q=${name}&limit=1&appid=${API_KEY}`;
	response = await get(URL);
	return response[0];
}

async function getWeatherFromName( name ){
	let coord = await getCoordFromName(name);
	let URL = `https://api.openweathermap.org/data/2.5/weather?lat=${coord.lat}&lon=${coord.lon}&units=metric&appid=${API_KEY}`;
	return await get(URL);
}
