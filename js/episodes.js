document.addEventListener("DOMContentLoaded", function() {
    const videoImage = document.getElementById('video-image');
    const videoName = document.querySelector('.video-name'); // Corrected the selector
    const episodeLinks = document.querySelectorAll('.sidebar-episodes-item');

    const backButton = document.getElementById('back-to-title-button');

    episodeLinks.forEach((link) => {
        link.textContent = link.getAttribute('data-video-name');
        link.addEventListener('click', function() {
            const imageSrc = link.getAttribute('data-image');
            const name = link.getAttribute('data-video-name');
            link.textContent = name;

            videoImage.src = imageSrc;
            videoName.textContent = name;
        })
    });
    backButton.textContent = "Back to title";
});
