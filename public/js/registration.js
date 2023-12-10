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
    const fileInput = document.getElementById("customProfilePicture");
    const image = document.getElementById("registerProfilePicture");

    if (fileInput.files && fileInput.files[0]) {
        const blob = URL.createObjectURL(fileInput.files[0]);
        const newImage = new Image();
        newImage.onload = function () {
            image.src = resizeImage(newImage);
            image.width = 200;
            image.height = 200;
        };
        newImage.src = blob;
    }
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
        throw new Error("Image to resize is null");
    }
}

async function registerUser() {
    const username = document.getElementById("registrationUsername").value;
    const password = document.getElementById("registrationPassword").value;
    const email = document.getElementById("registrationEmail").value;

    try{
        const profilePicture = document.getElementById("customProfilePicture").files[0];

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('email', email);
        formData.append('profilePicture', profilePicture);

        const res = await fetch('http://localhost:3000/register', {
            method: 'POST',
            body: formData
        });

        if(res.ok) {
            const result = await res.json();
            console.log(result);
        }
    } catch (err) {
        console.error(err);
    }
}