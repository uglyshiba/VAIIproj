document.addEventListener("DOMContentLoaded", function() {
    randomizeLetterColor("nadpis");
});

function randomizeLetterColor(elementId) {
    var element = document.getElementById(elementId);
    if (element) {
        var text = element.textContent;
        element.style.color = getRandomColor(); // Set initial text color
        element.innerHTML = text.split('').map(function (letter) {
            var randomColor = getRandomColor();
            return '<span style="color:' + randomColor + ';">' + letter + '</span>';
        }).join('');
    }
}

function getRandomColor() {
    var randRed = Math.floor(Math.random() * 220 + 20);
    var randGreen = Math.floor(Math.random() * 220 + 20);
    var randBlue = Math.floor(Math.random() * 200 + 20);

    return 'rgb(' + randRed + ',' + randGreen + ',' + randBlue + ')';
}
