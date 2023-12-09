document.addEventListener('DOMContentLoaded', function () {
    const defaultProfilePicture = document.getElementById("registerProfilePicture")
    if(defaultProfilePicture) {
        defaultProfilePicture.src = resizeImage(defaultProfilePicture);
    }

    const form = document.querySelector('form');
    if(form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            registerUser();
        });
    }
})


function changeImage() {

}

function resizeImage (image) {
    if(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(image, 0, 0, 200, 200);
        return canvas.toDataURL('image/jpeg', 1.0);
    } else {
        return null;
    }
}

async function registerUser() {
    const username = document.getElementById("registrationUsername").value;
    const password = document.getElementById("registrationPassword").value;
    const email = document.getElementById("registrationEmail").value;

    try{
        const profilePicture = document.getElementById("registerProfilePicture").files[0];

        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({ username, password, email, profilePicture })
        });

        if(res.ok) {
            const result = await res.json();
            console.log(result);
        }
    } catch (err) {
        console.error(err);
    }
}