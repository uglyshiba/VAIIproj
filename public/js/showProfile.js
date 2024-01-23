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
                    const userProfileSettings = document.createElement('div');
                    userProfileSettings.className = 'user-profile-settings';

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

                    const changeEmailSpan = document.createElement('span');
                    changeEmailSpan.textContent = 'Change email';
                    const newMailInput = document.createElement('input');
                    newMailInput.type = 'text';
                    newMailInput.id = 'newMail';
                    const mailBtn = document.createElement('button');
                    mailBtn.id = 'mailBtn';
                    mailBtn.textContent = 'Change email';

                    userProfileSettings.appendChild(changeEmailSpan);
                    userProfileSettings.appendChild(newMailInput);
                    userProfileSettings.appendChild(mailBtn);

                    const oldPasswordSpan = document.createElement('span');
                    oldPasswordSpan.textContent = 'Old password';
                    const pswdOldInput = document.createElement('input');
                    pswdOldInput.type = 'text';
                    pswdOldInput.id = 'pswdOld';
                    const newPasswordSpan = document.createElement('span');
                    newPasswordSpan.textContent = 'New password';
                    const pswdNewInput = document.createElement('input');
                    pswdNewInput.type = 'text';
                    pswdNewInput.id = 'pswdNew';
                    const retypePasswordSpan = document.createElement('span');
                    retypePasswordSpan.textContent = 'Retype new password';
                    const pswdAgainInput = document.createElement('input');
                    pswdAgainInput.type = 'text';
                    pswdAgainInput.id = 'pswdAgain';
                    const passBtn = document.createElement('button');
                    passBtn.className = 'passBtn';
                    passBtn.id = 'passBtn';
                    passBtn.textContent = 'Change password';

                    userProfileSettings.appendChild(oldPasswordSpan);
                    userProfileSettings.appendChild(pswdOldInput);
                    userProfileSettings.appendChild(newPasswordSpan);
                    userProfileSettings.appendChild(pswdNewInput);
                    userProfileSettings.appendChild(retypePasswordSpan);
                    userProfileSettings.appendChild(pswdAgainInput);
                    userProfileSettings.appendChild(passBtn);

                    const deleteAccountBtn = document.createElement('button');
                    deleteAccountBtn.className = 'deleteBtn';
                    deleteAccountBtn.style.backgroundColor = 'darkred';
                    deleteAccountBtn.style.color = 'white';
                    deleteAccountBtn.textContent = 'Delete account';

                    userProfileSettings.appendChild(deleteAccountBtn);

                    profileContainer.appendChild(userProfileSettings);
                }
            } else {
                console.error('Error fetching user profile:', response.statusText);
            }
        } catch (error) {
            console.error('Error displaying user profile page:', error);
        }
    };

    document.addEventListener("DOMContentLoaded", displayUserProfilePage);