document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('updateButton').addEventListener("click", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');

        updateUser(userId);
    })
});

async function updateUser(userId) {
    const username = document.getElementById("updateUsername").value;
    const email = document.getElementById("updateEmail").value;
    const password = document.getElementById("updatePassword").value;
    const passwordAgain = document.getElementById("passwordAgain").value;

    const feedback = document.getElementById("updateFeedback");

    if(password && (password !== passwordAgain)) {
        feedback.textContent = "Passwords are not matching";
        feedback.style.color = "red";
    } else {
        try{

            const requestData = {
                username: username,
                email: email,
                password: password,
            };

            const res = await fetch(`/update/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(requestData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(res.ok) {
                feedback.textContent="Update successful!";
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