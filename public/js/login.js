document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submitButton").addEventListener("click", function(event) {
        event.preventDefault();
        loginUser();
    })
})

async function loginUser() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if(username && password) {
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if(response.ok) {
                console.log('Login successful');
            } else {
                const errorData = await response.json();
                console.error('Login failed: ', errorData.error);
            }
        } catch{
            console.error("Error during logging in");
        }
    }
}