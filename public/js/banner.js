document.write(`
    <style>
        body, html {
            margin: 0;
            padding: 0;
        }
        .banner-container {
            position: relative;
            width: 100%;
            max-width: 100%;
            height: 0;
            padding-bottom: 30%;
            background-image: url('./resources/images/gum-banner.png');
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: center;
            overflow: hidden;
            background-color: #08adff;
        }
    </style>

    <a href="./index.html"> <div id ="banner"  class="banner-container"></div> </a>
`);
