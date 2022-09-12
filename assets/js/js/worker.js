onmessage = async function(e){

  let imageURL = e.data
  response = await fetch(imageURL);
  const blob = await response.blob()
  postMessage({
    imageURL: imageURL,
    blob: blob,
  });
}

