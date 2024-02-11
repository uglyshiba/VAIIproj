    import { checkLoginStatus, displayUserProfile } from "./checkSession.js";
    import { isPasswordValid, isMailValid } from "./formChecker.js";
    import {changeImage, resizeImage} from "./registration.js";

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
                const profileDisplay = document.createElement('div');
                profileDisplay.className = 'profile-display';
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

                profileDisplay.appendChild(profilePicture);
                profileDisplay.appendChild(profileName);
                profileContainer.appendChild(profileDisplay);
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
                    newNameInput.value = userData.username;
                    const nameBtn = document.createElement('button');
                    nameBtn.id = 'nameBtn';
                    nameBtn.textContent = 'Change username';
                    nameBtn.addEventListener('click', function() {
                        updateUsername(loggedInUser);
                    });


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
                    newMailInput.value = userData.email;

                    const mailBtn = document.createElement('button');
                    mailBtn.id = 'mailBtn';
                    mailBtn.textContent = 'Change email';
                    mailBtn.addEventListener('click', function() {
                        updateEmail(loggedInUser);
                    })

                    emailSettings.appendChild(changeEmailSpan);
                    emailSettings.appendChild(newMailInput);
                    emailSettings.appendChild(mailBtn);
                    email.appendChild(emailSettings);
                    document.body.appendChild(email);

                    const changeProfilePictureContainer = document.createElement('div');
                    changeProfilePictureContainer.className = 'change-profile-picture-container';
                    const uploadPictureButton = document.createElement('input');
                    uploadPictureButton.className = 'upload-picture-button';
                    uploadPictureButton.type = 'file';
                    uploadPictureButton.accept = 'image/*';
                    uploadPictureButton.onchange = function(event) {
                        changeProfilePicture(uploadPictureButton, pfp);
                    }
                    const confirmPictureUploadButton = document.createElement('button');
                    confirmPictureUploadButton.textContent = 'Upload new profile picture';
                    confirmPictureUploadButton.className = 'confirm-picture-upload-button';
                    confirmPictureUploadButton.addEventListener('click', function() {
                        submitProfilePicture(uploadPictureButton, loggedInUser);
                    })
                    changeProfilePictureContainer.appendChild(uploadPictureButton);
                    changeProfilePictureContainer.appendChild(confirmPictureUploadButton);
                    email.appendChild(changeProfilePictureContainer);


                    const password = document.createElement('div');
                    password.className = 'profile-container';
                    const passwordSettings = document.createElement('div');
                    passwordSettings.className = 'user-profile-settings';

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
                    passButton.addEventListener('click', function() {
                        updatePassword(loggedInUser);
                    })
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
                    deleteAccountBtn.addEventListener('click', () => {
                        deleteUser(userData.username);
                    });
                    document.body.appendChild(del);

                } else if(loggedInUser && loggedInUser.is_admin) {
                    const adminButtonsContainer = document.createElement('div');
                    adminButtonsContainer.className = 'admin-buttons-container';
                    profileContainer.appendChild(adminButtonsContainer);
                    const grantAdminButton = document.createElement('button');
                    grantAdminButton.textContent = 'Make Admin';
                    grantAdminButton.style.backgroundColor = '#ffb700';
                    grantAdminButton.className = 'grant-admin-button';
                    grantAdminButton.addEventListener('click', () => {
                        fetch(`http://localhost:3000/update/${userData.username}/makeAdmin`, {
                            method: 'PUT',
                            credentials: "include"
                        }).then(response => {
                            if(response.ok) {
                                alert('User is now an admin');
                            } else {
                                console.error(response.json().error);
                            }
                        })
                    })

                    const deleteUserButton = document.createElement('button');
                    deleteUserButton.className = 'admin-delete-user-button';
                    deleteUserButton.textContent = 'Delete user';
                    deleteUserButton.style.backgroundColor = 'darkred';
                    deleteUserButton.addEventListener('click', function() {
                        deleteUser(userData.username);
                    })

                    adminButtonsContainer.appendChild(grantAdminButton);
                    adminButtonsContainer.appendChild(deleteUserButton);
                }
            } else {
                console.error('Error fetching user profile:', response.statusText);
            }
        } catch (error) {
            console.error('Error displaying user profile page:', error);
        }
    };

    function deleteUser(userName) {
        const confirmation = confirm("Are you sure you want to delete your account?");
        if (confirmation) {
            fetch(`http://localhost:3000/users/${userName}`, {
                method: 'DELETE',
                credentials: "include"
            }).then(res => {
                if(res.ok) {
                    window.alert('User has been successfully deleted.')
                    window.location.href = 'index.html';
                    return res.json;
                } else {
                    throw new Error('Error deleting user ' + res.json);
                }
            }).catch (err => {
                console.error(err);
            })
        }
    }


    async function updateUsername(loggedInUser) {
        const newUsername = document.getElementById("newName").value;
        const currentUsername = loggedInUser.username;
        if(newUsername === currentUsername) {
            alert("New username cannot be same as the old one.");
            return;
        }
        const isPassVerified = await(verifyPassword());
        if(isPassVerified) {
            const requestData = {
                newUsername: newUsername
            }
            const updateRes = await fetch(`http://localhost:3000/update/${currentUsername}`, {
                method: 'PUT',
                body: JSON.stringify(requestData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(updateRes.ok) {
                alert('Username update successfull');
            } else {
                const errorData = await updateRes.json();
                alert(errorData.error);
            }
        } else {
            console.log("Password verification failed. Update abort");
        }
    }

    async function updateEmail(loggedInUser) {
        const newEmail = document.getElementById("newMail").value;
        if(!isMailValid(newEmail)) {
            return;
        }

        const currentUsername = loggedInUser.username;

        const isPassVerified = await(verifyPassword());
        if(isPassVerified) {
            const requestData = {
                newEmail: newEmail
            }
            const updateRes = await fetch(`http://localhost:3000/update/${currentUsername}`, {
                method: 'PUT',
                body: JSON.stringify(requestData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(updateRes.ok) {
                alert('Email update successful');
            } else {
                const errorData = await updateRes.json();
                alert(errorData.error);
            }
        } else {
            console.log("Password verification failed. Update abort");
        }
    }

    async function updatePassword(loggedInUser) {
        const newPass = document.getElementById("pswdNew").value;
        const newPassAgain = document.getElementById("pswdAgain").value;

        if(newPass !== newPassAgain) {
            alert("New password and retype password do not match");
            return;
        }

        if(!isPasswordValid(newPass)) {
            return;
        }

        const currentUsername = loggedInUser.username;

        const isPassVerified = await(verifyPassword());
        if(isPassVerified) {
            const requestData = {
                newPassword: newPass
            }
            const updateRes = await fetch(`http://localhost:3000/update/${currentUsername}`, {
                method: 'PUT',
                body: JSON.stringify(requestData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(updateRes.ok) {
                alert('Password update successful');
            } else {
                const errorData = await updateRes.json();
                alert(errorData.error);
            }
        } else {
            console.log("Password verification failed. Update abort");
        }
    }

    function changeProfilePicture(newProfilePicture, oldProfilePicture) {
        // oldProfilePicture.src = resizeImage(newProfilePicture);
        changeImage(newProfilePicture, oldProfilePicture);
    }

    async function submitProfilePicture(newProfilePicture, loggedInUser) {
        const formData = new FormData();
        if(!newProfilePicture.files[0]) {
            alert('You must submit a file before changing your profile picture');
            return;
        }
        formData.append('profilePicture', newProfilePicture.files[0]);

        const updateProfilePictureRes = await fetch(`http://localhost:3000/update/${loggedInUser.username}`, {
            method: 'PUT',
            body: formData,
            credentials: 'include'
        });

        if(updateProfilePictureRes.ok) {
            alert('Profile picture updated successfully');
        } else {
            const errorData = await updateProfilePictureRes.json();
            alert(errorData.error);
        }
    }

    async function verifyPassword() {
        try {
            const oldPass = prompt('Enter your current password');
            const res = await fetch('http://localhost:3000/users/verifyPassword', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify({ oldPass: oldPass }),
                credentials: 'include'
            });

            if (!res.ok) {
                console.log("Password cannot be verified");
                return false;
            }

            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    document.addEventListener("DOMContentLoaded", displayUserProfilePage);