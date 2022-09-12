function async func(){
    try{

        const resPost = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Milano&appid=e7de0504240eace7d42e58dae9fba001`)

        const post = await resPost.json()
        const y=console.log(post);
        
    }
    catch(error){
        console.log(error);
    }

}