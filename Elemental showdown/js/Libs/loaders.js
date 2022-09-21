
function loadImages(imgSourceArray) {
    let images = [];
    return new Promise((resolve, reject) => {
        imgSourceArray.forEach((imgSource, idx) => {
            images.push(new Image());
            images[idx].onload = () => { resolve(images); };
            images[idx].src = 'Resources/Images/' + imgSource;
        });
    });
}

function loadJSON(jsonSourceArray) {
    let files = [];
    return new Promise((resolve, reject) => {
        jsonSourceArray.forEach(jsonSource => {
            /*let httpRequest = new XMLHttpRequest();
            httpRequest.open('GET', 'Resources/json/' + jsonSource + '.json', true);
            httpRequest.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200 || this.status == 0) {
                      let file = JSON.parse(this.responseText);
                        files.push(file);
                    }
                }
            }
            httpRequest.send();*/
        });
    });
}
