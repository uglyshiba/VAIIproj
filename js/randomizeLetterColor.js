function randomizeLetterColor(elementId) {
    var element = document.getElementById(elementId)
}

function getRandomColor() {
    var randRed = Math.floor(Math.random() * 200);
    var randGreen = Math.floor(Math.random() * 200);
    var randBlue = Math.floor(Math.random() * 200);

    var color = 'rgb(' + randRed + ',' + randGreen + ',' + randBlue + ')';
    return color
}