document.write(`
    <style>
        .banner-container {
            position: relative;
            width: 100%;
            max-width: 100%;
            height: 0;
            padding-bottom: 30%; /* Adjust based on the desired percentage */
            background-image: url('./resources/images/gum-banner.png');
            background-size: 100% 100%; /* Make the image fill the entire width */
            background-repeat: no-repeat;
            background-position: center;
            overflow: hidden;
        }
    </style>

    <a href="./index.html"> <div class="banner-container"></div> </a>
`);
