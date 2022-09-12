

function darkmode(){
	body = document.body;
	body.classList.toggle('dark-theme');
}

function responsive_menu(){
			const hamburger = document.querySelector(".hamburger");
			const navMenu = document.querySelector(".nav-menu");

			hamburger.addEventListener("click", ()=> {
				hamburger.classList.toggle("active");
				navMenu.classList.toggle("active");
			});

			let links =  document.getElementsByClassName("navigation-link");
			
			for( i = 0; i<links.length; i++  ){
				links[i].addEventListener("click", ()=>{
					hamburger.classlist.remove("active");
					navMenu.classlist.remove("active");
				});
			}
		}