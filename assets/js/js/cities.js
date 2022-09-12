document.body.onload = function() {
	listener_for_images();
	responsive_menu();
};	

function listener_for_images(){
	let imgs = document.getElementsByClassName('carousel-img')
	imgs[0].onclick = ()=> { window.location.href = "/w/city/prague"};
	imgs[1].onclick = ()=> { window.location.href = "/w/city/rome"};
	imgs[2].onclick = ()=> { window.location.href = "/w/city/edinburgh"}
}