document.addEventListener('DOMContentLoaded', function () {
    const defaultProfilePicture = document.getElementById("registerProfilePicture");
    if(defaultProfilePicture) {
        defaultProfilePicture.src = resizeImage(defaultProfilePicture);
    }

    document.getElementById('registerButton').addEventListener("click", () => {
        registerUser();
    })
})


function changeImage() {
    const fileInput = document.getElementById("customProfilePicture");
    const image = document.getElementById("registerProfilePicture");

    if (fileInput.files && fileInput.files[0]) {
        const blob = URL.createObjectURL(fileInput.files[0]);
        const newImage = new Image();
        newImage.onload = function () {
            image.src = resizeImage(newImage);
            image.width = 100;
            image.height = 100;
        };
        newImage.src = blob;
    }
}

function resizeImage (image) {
    if(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(image, 0, 0, 100, 100);
        return canvas.toDataURL('image/jpeg', 1.0);
    } else {
        throw new Error("Image to resize is null");
    }
}

async function registerUser() {
    const username = document.getElementById("registrationUsername").value;
    const password = document.getElementById("registrationPassword").value;
    const passwordAgain = document.getElementById("passwordAgain").value;
    const email = document.getElementById("registrationEmail").value;

    const feedback = document.getElementById("registerFeedback");

    if(password !== passwordAgain) {
        feedback.textContent = "Passwords are not matching";
        feedback.style.color = "red";
    } else {
        try{
            let profilePicture = document.getElementById("customProfilePicture").files[0];
            if(!profilePicture) {
                profilePicture = document.getElementById("defaultProfilePicture").files[0];
            }
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
                feedback.textContent="Registration successful!";
                feedback.style.color = "green";
            } else {
                const errorData = await res.json();
                feedback.textContent = errorData.error;
                feedback.style.color = "red";
            }
        } catch (err) {
            console.error(err);
        }
    }
}
