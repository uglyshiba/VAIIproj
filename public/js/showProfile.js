    import { checkLoginStatus, displayUserProfile } from "./checkSession.js";

    const displayUserProfilePage = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const username = urlParams.get('username');

            const response = await fetch(`http://localhost:3000/users/${username}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();

                const profileContainer = document.createElement('div');
                profileContainer.className = 'profile-container';

                const profilePicture = document.createElement('div');
                profilePicture.className = 'profile-picture';
                const pfp = document.createElement('img');

                pfp.src = 'data:image/jpeg;base64,' + userData.profilePicture;
                profilePicture.appendChild(pfp);

                const profileName = document.createElement('div');
                profileName.className = 'profile-name';
                const usernameSpan = document.createElement('span');
                usernameSpan.id = 'username';
                usernameSpan.textContent = userData.username;
                profileName.appendChild(usernameSpan);

                profileContainer.appendChild(profilePicture);
                profileContainer.appendChild(profileName);

                document.body.appendChild(profileContainer);

                const loggedInUser = await checkLoginStatus();

                if (loggedInUser && loggedInUser.id === userData.id) {
                    // Display fields and buttons for editing the profile
                    const userProfileSettings = document.createElement('div');
                    userProfileSettings.className = 'user-profile-settings';

                    // Add elements for username change
                    const changeUsernameSpan = document.createElement('span');
                    changeUsernameSpan.textContent = 'Change username';
                    const newNameInput = document.createElement('input');
                    newNameInput.type = 'text';
                    newNameInput.id = 'newName';
                    const nameBtn = document.createElement('button');
                    nameBtn.id = 'nameBtn';
                    nameBtn.textContent = 'Change username';

                    userProfileSettings.appendChild(changeUsernameSpan);
                    userProfileSettings.appendChild(newNameInput);
                    userProfileSettings.appendChild(nameBtn);
                    profileContainer.appendChild(userProfileSettings);
                    // Add elements for email change
                    const email = document.createElement('div');
                    email.className = 'profile-container';
                    const emailSettings = document.createElement('div');
                    emailSettings.className = 'user-profile-settings';
                    const changeEmailSpan = document.createElement('span');
                    changeEmailSpan.textContent = 'Change email';
                    const newMailInput = document.createElement('input');
                    newMailInput.type = 'text';
                    newMailInput.id = 'newMail';
                    const mailBtn = document.createElement('button');
                    mailBtn.id = 'mailBtn';
                    mailBtn.textContent = 'Change email';

                    emailSettings.appendChild(changeEmailSpan);
                    emailSettings.appendChild(newMailInput);
                    emailSettings.appendChild(mailBtn);
                    email.appendChild(emailSettings);
                    document.body.appendChild(email);

                    const password = document.createElement('div');
                    password.className = 'profile-container';
                    const passwordSettings = document.createElement('div');
                    passwordSettings.className = 'user-profile-settings';
                    const oldSpan = document.createElement('span');
                    oldSpan.textContent = "Old password";
                    passwordSettings.appendChild(oldSpan);
                    const oldInput = document.createElement('input');
                    oldInput.type = "text";
                    oldInput.id = "pswdOld";
                    passwordSettings.appendChild(oldInput);
                    const newSpan = document.createElement('span');
                    newSpan.textContent = "New password";
                    passwordSettings.appendChild(newSpan);
                    const newInput = document.createElement('input');
                    newInput.type = "text";
                    newInput.id = "pswdNew";
                    passwordSettings.appendChild(newInput);
                    const againSpan = document.createElement('span');
                    againSpan.textContent = "Retype password";
                    passwordSettings.appendChild(againSpan);
                    const againInput = document.createElement('input');
                    againInput.type = "text";
                    againInput.id = "pswdAgain";
                    passwordSettings.appendChild(againInput);
                    const passButton = document.createElement('button');
                    passButton.className="passBtn";
                    passButton.id = "passBtn";
                    passButton.textContent = "Change password";
                    passwordSettings.appendChild(passButton);
                    password.appendChild(passwordSettings);
                    document.body.appendChild(password);


                    const del = document.createElement('div');
                    del.className = "profile-container";
                    const delSettings = document.createElement('div');
                    delSettings.className = "user-profile-settings";
                    const deleteAccountBtn = document.createElement('button');
                    deleteAccountBtn.className = 'deleteBtn';
                    deleteAccountBtn.style.backgroundColor = 'darkred';
                    deleteAccountBtn.style.color = 'white';
                    deleteAccountBtn.textContent = 'Delete account';
                    delSettings.appendChild(deleteAccountBtn);
                    del.appendChild(delSettings);
                    document.body.appendChild(del);

                }
            } else {
                console.error('Error fetching user profile:', response.statusText);
            }
        } catch (error) {
            console.error('Error displaying user profile page:', error);
        }
    };

    document.addEventListener("DOMContentLoaded", displayUserProfilePage);