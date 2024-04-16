//IMPORTANT NOTE: If the users in the database gets nuked for some reason this fix is to manually add a user because all the user based features stop working properly

const COOLDOWN_TIME = 2500;
const AFK_TIME = 5 * 60 * 1000; // converting from minutes to milliseconds (min * 60 seconds * 1000)
let inCooldown = false;
let slowmode = false;
let ignoredUsers = [];
const adminUsers = ["Israel", "Admin"];
let userStatus = "🟢"
let userName = null;
let lastmaxscroll;
let userslogged;
let htmlenabled = false;

setTimeout(checkHTMLEnabled, 10000);
let currentTheme = 1;

//#region Functions
function getMessageType(message, name) {
    if (message.split(" ")[0] == "/announce" || message.split(" ")[0] == "/secret") {
        if (message.split(" ")[0] == "/announce") {
            if (adminUsers.includes(name)) {
                return "announcement";
            } else {
                return "text";
            }
        } else {
            return "announcement";
        }
          
    } else if (message.substring(0, 3) === "```") {
        return "code";
    } else if (message.substring(0, 5) === "data:") {
        return "image";
    } else {
        return "text";
    }
}

function commandHandler(name, message) {
    let splitArr = message.split(" ");
    let joinedStr = splitArr.slice(1).join(" ");
    switch (splitArr[0]) {
        case "/help":
            alert("/help - displays a list of commands\n/ignore (user) - hides the messages of the user but only for you\n/unignore (user) - unhides the messages of the user but only for you\n/report (user) (reason) - reports the user to the owner with a message describing what they did\n\nmessage prefixes:\n``` - displays a message as code");
            return null;
        case "/announce":
            if (adminUsers.includes(name)) {
                return message.split(" ").slice(1).join(" ");
            } else {
                return wrapLinksInAnchorTags(message);
            }
        case "/secret":
            return `${name} has found a secret`;
        case "/ignore":
            if (!ignoredUsers.includes(joinedStr)) {
                ignoredUsers += joinedStr;
            }
            return null;
        case "/unignore":
            if (ignoredUsers.includes(joinedStr)) {
                ignoredUsers.splice(ignoredUsers.indexOf(joinedStr), 1);
            }
            return null;
    
        default:
            if (message.substring(0, 3) === "```") {
                return message.substring(3);
            } else {
                return wrapLinksInAnchorTags(message);
            }
    }
}

function switchTheme() {
    let stylesheet = document.getElementById('theme');
    switch (currentTheme) {
        case 1:
            stylesheet.setAttribute('href', 'smoke.css');
            localStorage.setItem('chatterboxStyle', "smoke.css");
            currentTheme++;
            break;
        case 2:
            stylesheet.setAttribute('href', 'demichrome.css');
            localStorage.setItem('chatterboxStyle', "demichrome.css");
            currentTheme++;
            break;
        case 3:
            stylesheet.setAttribute('href', 'eulbink.css');
            localStorage.setItem('chatterboxStyle', "eulbink.css");
            currentTheme++;
            break;
        case 4:
            stylesheet.setAttribute('href', 'midnightblaze.css');
            localStorage.setItem('chatterboxStyle', "midnightblaze.css");
            currentTheme++;
            break;
        case 5:
            stylesheet.setAttribute('href', 'deafult.css');
            localStorage.setItem('chatterboxStyle', "deafult.css");
            currentTheme = 1;
            break;
    }
}

function wrapLinksInAnchorTags(text) {
    // Regular expression to match URLs
    var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

    // Replace URLs with anchor tags ($1 is a placeholder for the matched URL)
    var wrappedText = text.replace(urlRegex, '<a href="$1">$1</a>');

    return wrappedText;
}

function removeHTMLTags(input) {
    const temp = document.createElement('div');
    temp.innerHTML = input;

    // Extract the text content without HTML tags
    const filteredContent = temp.textContent || temp.innerText;

    return filteredContent;
}

function uploadFile(inputElement, parentElement) {
    var file = inputElement.files[0];
    var filetype = file.type;
    var reader = new FileReader();
    reader.onloadend = function() { 
        console.log(reader.result)
        parentElement.send_message(reader.result, "image");
    }
    reader.readAsDataURL(file);
}

function checkHTMLEnabled() {
    var db = firebase.database()

    db.ref('shutdown/').on('value', function(shutdown_object) {
        // if there are no users in the chat it will exit immediately
        if(shutdown_object.numChildren() == 0){
            return;
        }

        

        // convert the user object values to an array.
        let shutdown = Object.values(shutdown_object.val());

        htmlenabled = !shutdown[0];

        // Go to the recent message at the bottom of the container (very bad)
        //chat_content_container.scrollTop = chat_content_container.scrollHeight;
    });
}
//#endregion

//#region Firbase and localStorage
sessionStorage.clear();
document.getElementById('theme').setAttribute('href', localStorage.getItem('chatterboxStyle') || 'deafult.css');
// web app Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyB5nsHxcMFITTLckEchyNKzXsgESiCgj2o",
    authDomain: "chatterboxchatroom-b10f5.firebaseapp.com",
    projectId: "chatterboxchatroom-b10f5",
    storageBucket: "chatterboxchatroom-b10f5.appspot.com",
    messagingSenderId: "731863177580",
    appId: "1:731863177580:web:adcefc8a29965bb74abb49"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.database()
//#endregion

//#region Main
// Chatterbox class
class CHATTERBOX_CHAT{
    // creates the home page
    home() {
        document.body.innerHTML = '';
        this.create_title();
        this.create_join_form();
    }

    // creates the chat page
    chat() {
        this.create_title();
        this.create_chat();
    }

    // creates the title part of pages
    create_title() {
        var title_container = document.createElement('div');
        title_container.setAttribute('id', 'title_container');
        var title_inner_container = document.createElement('div');
        title_inner_container.setAttribute('id', 'title_inner_container');

        var title = document.createElement('h1');
        title.setAttribute('id', 'title');
        title.textContent = 'Chatterbox';

        title_inner_container.append(title);
        title_container.append(title_inner_container);
        document.body.append(title_container);
    }

    // creates the join form
    create_join_form() {
        var parent = this;

        var join_container = document.createElement('div');
        join_container.setAttribute('id', 'join_container');
        var join_inner_container = document.createElement('div');
        join_inner_container.setAttribute('id', 'join_inner_container');

        var join_button_container = document.createElement('div');
        join_button_container.setAttribute('id', 'join_button_container');

        var join_button = document.createElement('button');
        join_button.setAttribute('id', 'join_button');
        join_button.innerHTML = 'Join <i class="fas fa-sign-in-alt"></i>';

        var join_input_container = document.createElement('div');
        join_input_container.setAttribute('id', 'join_input_container');

        var join_input = document.createElement('input');
        join_input.setAttribute('id', 'join_input');
        join_input.setAttribute('maxlength', 20);
        join_input.placeholder = 'Enter Your Name...';
        
        // Every time join_input is typed in
        join_input.onkeyup  = function() {
            // If the input is longer that 0 letters
            if (join_input.value.length > 0) {
                // Makes the button light up
                join_button.classList.add('enabled');
                // Allows the user to click the button
                join_button.onclick = function() {
                    // Check if the user is already logged in
                    parent.is_user_logged_in(join_input.value).then((isLoggedIn) => {
                        if (isLoggedIn) {
                            alert(`${join_input.value} is already logged in.`);
                            return; // Stop further execution
                        }

                        // Prevents the user from entering in a blank name after the button is activated
                        if (join_input.value == '') { 
                            return;
                        }

                        // Check if the user is an admin
                        if (adminUsers.includes(join_input.value)) {
                            const passcode = prompt('Please enter the admin passcode:');
                            if (passcode === null || passcode === '') {
                                alert('Passcode is required.');
                                return; // Stop further execution
                            }

                            // Convert the passcode to base64
                            const encodedPasscode = btoa(passcode);

                            // Retrieve the admin passcode from the database
                            db.ref('admin/passcode').once('value', function(snapshot) {
                                const storedPasscode = snapshot.val();
        
                                // Compare the entered passcode with the stored passcode
                                if (encodedPasscode !== storedPasscode) {
                                    alert('Invalid passcode.');
                                    return; // Stop further execution
                                }
                                
                                // Saves the name to local storage
                                parent.save_name(join_input.value);
                                userName = parent.get_name();
                                // Remove the join_container then create the chat container
                                join_container.remove();
                                parent.create_chat();
                                setInterval(function() {
                                    if (userName != sessionStorage.getItem('name')) {
                                        window.close();
                                    }
                                }, 1000); // this prevents messing with the username through inspect element
                            });
                        } else {
                            // Saves the name to local storage
                            parent.save_name(join_input.value);
                            userName = parent.get_name();
                            // Remove the join_container then create the chat container
                            join_container.remove();
                            parent.create_chat();
                            setInterval(function() {
                                if (userName != sessionStorage.getItem('name')) {
                                    window.close();
                                }
                            }, 1000); // this prevents messing with the username through inspect element
                        }
                    });
                }
            } else {
                // If the join_input is empty then the join_button will be disabled again
                join_button.classList.remove('enabled');
            }
        }

        // Append everything to the body
        join_button_container.append(join_button);
        join_input_container.append(join_input);
        join_inner_container.append(join_input_container, join_button_container);
        join_container.append(join_inner_container);
        document.body.append(join_container);
    }

    // creates a loading circle that is used in the chat container
    create_load(container_id) {
        var parent = this;

        var container = document.getElementById(container_id);
        container.innerHTML = '';

        var loader_container = document.createElement('div');
        loader_container.setAttribute('class', 'loader_container');

        var loader = document.createElement('div');
        loader.setAttribute('class', 'loader');

        loader_container.append(loader);
        container.append(loader_container);
    }
    
    // creates the shutdown screen
    create_shutdown(message) {
        var parent = this;
        
        var container = document.getElementsByTagName('body')[0];
        container.innerHTML = '';
        
        var shutdownContainer = document.createElement('div');
        shutdownContainer.setAttribute('class', 'shutdown_container');
        
        var shutdownMessage = document.createElement('h1');
        shutdownMessage.innerText = 'Server Shutdown';
        shutdownMessage.setAttribute('class', 'shutdown_message');
        
        var noticeMessage = document.createElement('p');
        noticeMessage.innerText = message;
        noticeMessage.setAttribute('class', 'notice_message');
        
        shutdownContainer.appendChild(shutdownMessage);
        shutdownContainer.appendChild(noticeMessage);
        container.appendChild(shutdownContainer);
    }

    // creates the chat container
    create_chat() {
        var parent = this;
        userStatus = "🟢";
        parent.update_status();
        
        var title_container = document.getElementById('title_container');
        var title = document.getElementById('title');
        title_container.classList.add('chat_title_container');
        // Make the title smaller by giving it the 'chat_title' class
        title.classList.add('chat_title');

        var chat_container = document.createElement('div');
        chat_container.setAttribute('id', 'chat_container');

        var chat_inner_container = document.createElement('div');
        chat_inner_container.setAttribute('id', 'chat_inner_container');

        var chat_content_container = document.createElement('div');
        chat_content_container.setAttribute('id', 'chat_content_container');

        var chat_input_container = document.createElement('div');
        chat_input_container.setAttribute('id', 'chat_input_container');

        var file_input = document.createElement("input");
        file_input.type = "file";
        file_input.onchange = function() {
            uploadFile(this, parent);
            this.value = null;
        };
        file_input.accept = "image/*";
        file_input.setAttribute('class', 'fileupload');

        var chat_input_send = document.createElement('button');
        chat_input_send.setAttribute('id', 'chat_input_send');
        chat_input_send.setAttribute('disabled', true);
        chat_input_send.innerHTML = `<i class="far fa-paper-plane"></i>`;

        var chat_input = document.createElement('input');
        chat_input.setAttribute('id', 'chat_input');
        // Max message length will be set to 1000 characters
        chat_input.setAttribute('maxlength', 1000);
        // Get the name of the user and sets the placeholder of the chatinput to "Name. Say something..."
        chat_input.placeholder = `${parent.get_name().split(" ")[0]}. Say something...`;
        chat_input.onkeyup  = function(e){
            if(chat_input.value.length > 0) {
                chat_input_send.removeAttribute('disabled');
                chat_input_send.classList.add('enabled');
                chat_input_send.onclick = function() {
                    if (!inCooldown) {
                        chat_input_send.setAttribute('disabled', true);
                        chat_input_send.classList.remove('enabled');
                        if (chat_input.value.length <= 0) {
                            return;
                        }
                        // Creates the loading circle in the 'chat_content_container'
                        parent.create_load('chat_content_container');
                        
                        // Sends the message
                        let chatInputMessage;
                        if (htmlenabled) {
                            chatInputMessage = removeHTMLTags(chat_input.value);
                        } else {
                            chatInputMessage = chat_input.value;
                        }
                        parent.send_message(chatInputMessage, getMessageType(chat_input.value, parent.get_name()));

                        // Clear the chat input box them focus on the chat input
                        chat_input.value = '';
                        chat_input.focus();

                        // Starts the chat cooldown
                        inCooldown = true;
                        chat_input_send.disabled = true;

                        setTimeout(() => {
                            inCooldown = false;
                            //messageInput.disabled = false;
                        }, COOLDOWN_TIME + (slowmode * 5000));
                    }
                }

                if (e.key == "Enter") {
                    if (!inCooldown) {
                        chat_input_send.setAttribute('disabled', true);
                        chat_input_send.classList.remove('enabled');
                        if (chat_input.value.length <= 0) {
                            return;
                        }
                        // Creates the loading circle in the 'chat_content_container'
                        parent.create_load('chat_content_container');
                        
                        // Sends the message
                        let chatInputMessage;
                        if (htmlenabled) {
                            chatInputMessage = removeHTMLTags(chat_input.value);
                        } else {
                            chatInputMessage = chat_input.value;
                        }
                        parent.send_message(chatInputMessage, getMessageType(chat_input.value, parent.get_name()));

                        // Clear the chat input box them focus on the chat input
                        chat_input.value = '';
                        chat_input.focus();

                        // Starts the chat cooldown
                        inCooldown = true;
                        chat_input_send.disabled = true;

                        setTimeout(() => {
                            inCooldown = false;
                            //messageInput.disabled = false;
                        }, COOLDOWN_TIME + (slowmode * 5000));
                    }
                }
            } else {
                chat_input_send.classList.remove('enabled');
            }
        }

        var chat_logout_container = document.createElement('div');
        chat_logout_container.setAttribute('id', 'chat_logout_container');

        var chat_logout = document.createElement('button');
        chat_logout.setAttribute('id', 'chat_logout');
        chat_logout.textContent = `${parent.get_name()} • logout`;
        
        // Sets the user status to offline and then removing the name from the sessionstorage and going back to the home page
        chat_logout.onclick = function() {
            userStatus = "⚪";
            parent.update_status();
            
            sessionStorage.clear();
            userName = null;

            parent.home();
        }

        var themeButton = document.createElement('button');
        themeButton.setAttribute('id', 'themeButton');
        themeButton.setAttribute('onclick', 'switchTheme()');

        var users_content_container = document.createElement('div');
        users_content_container.setAttribute('id', 'users_content_container');

        chat_logout_container.append(chat_logout);
        chat_input_container.append(chat_input, file_input, chat_input_send);
        chat_inner_container.append(chat_content_container, chat_input_container, chat_logout_container);
        chat_container.append(chat_inner_container);
        document.body.append(chat_container);
        document.body.append(themeButton);
        document.body.append(users_content_container);
        // After creating the chat. the loading circle in the 'chat_content_container'
        parent.create_load('chat_content_container');
        // refresh will get the chat data from Firebase
        parent.refresh_chat();
        chat_content_container.scrollTop = chat_content_container.scrollHeight;
        lastmaxscroll = chat_content_container.scrollHeight;
    }

    // saves the name to sessionStorage
    save_name(name) {
        sessionStorage.setItem('name', name);
    }
    // saves the message to the firebase database for it to be displayed
    send_message(message, type) {
        var parent = this;
        // if the local storage name is null and there is no message then dont send a message
        if (parent.get_name() == null && message == null) {
            return;
        }

        // checks if the user has send a command
        message = commandHandler(parent.get_name(), message);

        if (message == null) {
            parent.refresh_chat();
            return;
        }

        // resets countdown before user is set to bieng afk
        clearTimeout(afkTimeout);

        // if the user was previously afk their status will be set back to online
        if (userStatus == "🟡") {
            userStatus = "🟢";
            parent.update_status();
        }

        afkTimeout = setTimeout(function() {
            userStatus = "🟡";
            parent.update_status();
        }, AFK_TIME);

        // Get the firebase database chat messages
        db.ref('chats/').once('value', function(message_object) {

            var date = new Date();
            var dateString = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();

            // This index is mortant. It will help organize the chat in order
            var index = parseFloat(message_object.numChildren()) + 1;
            db.ref('chats/' + `message_${index}`).set({
                name: parent.get_name(),
                message: message,
                type: type,
                date: dateString,
                index: index
            })
            .then(function() {
                // After sending the message the chat is refreshed to get the new messages
                parent.refresh_chat();
            })
        })
    }

    // Gets the username from sessionStorage
    get_name() {
        if (sessionStorage.getItem('name') != null) {
            return sessionStorage.getItem('name');
        } else {
            // if the name is null for some reason it will send the user to the homepage immediately
            this.home();
            return null;
        }
    }

    // Checks if chatterbox has been put in slowmode or has been shutdown
    get_shutdown() {
        var parent = this;
        db.ref('shutdown/').on('value', function(shutdown_object) {
            if (shutdown_object.numChildren() == 0) {
                return;
            }

            if (shutdown_object.val().value) {
                parent.create_shutdown(shutdown_object.val().message);
            } else if (shutdown_object.val().slowmode) {
                slowmode = true;
            } else {
                slowmode = false;
            }
        })
    }

    // Gets the message/chat data from firebase
    refresh_chat() {
        var chat_content_container = document.getElementById('chat_content_container');

        // Get the messages from firebase
        db.ref('chats/').on('value', function(messages_object) {
            // When the data is recieved clear chat_content_container
            chat_content_container.innerHTML = '';
            // if there are no messages in the chat then it will return
            if (messages_object.numChildren() == 0) {
                return;
            }

            

            // convert the message object values to an array.
            var messages = Object.values(messages_object.val());
            var guide = [];
            var unordered = [];
            var ordered = [];

            for (var i, i = 0; i < messages.length; i++) {
                // The guide is an array from 0 to the messages.length
                guide.push(i+1);

                // unordered is the [message, index_of_the_message]
                unordered.push([messages[i], messages[i]?.index || i]);                
            }

            // Sorts the unordered messages by the guide
            guide.forEach(function(key) {
                var found = false;
                unordered = unordered.filter(function(item) {
                    if (!found && item[1] == key) {
                        // pushs the ordered messages to ordered array
                        ordered.push(item[0]);
                        found = true;
                        return false;
                    } else {
                        return true;
                    }
                })
            })

            // displays the ordered messages
            ordered.forEach(function(data) {
                var name = data.name;
                var message = data.message;
                var type = data.type;
                var date = data.date;

                var message_container = document.createElement('div');
                message_container.setAttribute('class', 'message_container');

                var message_inner_container = document.createElement('div');
                message_inner_container.setAttribute('class', 'message_inner_container');

                var message_user_container = document.createElement('div');
                message_user_container.setAttribute('class', 'message_user_container');
                
                if (type != "announcement") {
                    var message_user = document.createElement('p');
                    message_user.setAttribute('class', 'message_user');
                    message_user.innerHTML = `${name} <i>${date}</i>`;
                }
                var message_content_container = document.createElement('div');
                message_content_container.setAttribute('class', 'message_content_container');

                var message_content;
                
                if (type != "image") {
                    message_content = document.createElement('p');
                    switch (type) {
                        case "text":
                            message_content.setAttribute('class', 'message_content');
                            break;
                        case "code":
                            message_content.setAttribute('class', 'message_content code');
                            break;
                        case "announcement":
                            message_content.setAttribute('class', 'message_content announcement');
                            break;
                        default:
                            break;
                    }
                } else {
                    message_content = document.createElement('img');
                    message_content.src = `${message}`;
                    message_content.setAttribute('class', 'message_content');
                }

                
                if (ignoredUsers.includes(name) && type != "announcement") { // minimized any messages from ignored users
                    message_content.classList.add("minimized");

                    message_content.onclick = function() {
                        this.classList.toggle("minimized");
                        this.classList.toggle("expanded");
                    };
                }
                
                if (type != "image") {
                    message_content.innerHTML = `${message}`;
                }

                if (type != "announcement") {
                    message_user_container.append(message_user);
                }
                message_content_container.append(message_content);
                message_inner_container.append(message_user_container, message_content_container);
                message_container.append(message_inner_container);

                chat_content_container.append(message_container);
            });
            
            // Go to the most recent message at the bottom of the container (bit of a problem for when other users are trying to read older messages)
            if (chat_content_container.scrollTop == lastmaxscroll) {
                chat_content_container.scrollTop = chat_content_container.scrollHeight;
            }
            lastmaxscroll = chat_content_container.scrollHeight;
        })
        this.refresh_status();
        this.get_shutdown(); // makes sure the chat isnt shutdown
    }

    refresh_status() {
        var users_content_container = document.getElementById('users_content_container');

        // Get the users from firebase
        db.ref('users/').on('value', function(users_object) {
            users_content_container.innerHTML = '';
            // if there are no users in the chat it will return
            if (users_object.numChildren() == 0) {
                return;
            }

            // convert the user object values to an array.
            let users = Object.values(users_object.val());

            users_content_container.innerHTML = "<div>";

            for (let i = 0; i < users.length; i++) {
                users_content_container.innerHTML += `<p>${users[i].name}: ${users[i].status}</p>`;
            }
            users_content_container.innerHTML += "</div>";
            
            // Go to the recent message at the bottom of the container (very bad)
            //chat_content_container.scrollTop = chat_content_container.scrollHeight;
        });
    }

    is_user_logged_in(name) {
        return new Promise((resolve, reject) => {
            db.ref('users/').once('value', function(users_object) {
                // if there are no users in the chat it will exit immediately
                if(users_object.numChildren() == 0){
                    resolve(false);
                    return;
                }

                // convert the user object values to an array.
                let users = Object.values(users_object.val());

                for (let i = 0; i < users.length; i++) {
                    if (users[i].name === name) {
                        resolve(users[i].status !== '⚪');
                        return;
                    }
                }
                resolve(false);
            });
        });
    }

    update_status() {
        var parent = this;

        // Get the users from firebase
        db.ref('users/').on('value', function(users_object) {
            // When we get the data clear users_content_container
            // if there are no users in the chat it will exit immediately or the users name is null for some reason
            if (users_object.numChildren() == 0 || parent.get_name() == null) {
                return;
            }

            db.ref('users/' + parent.get_name()).set({
                name: parent.get_name(),
                status: userStatus,
                loggedIn: (userStatus != "⚪") ? true : false
            });
        });
    }
}

var app = new CHATTERBOX_CHAT();
app.home();


var afkTimeout = setTimeout(function() {
    userStatus = "🟡";
    app.update_status();
}, AFK_TIME);


document.addEventListener('visibilitychange', e=>{

    if (document.visibilityState === 'visible') {
        userStatus = "🟢";
        app.update_status();
    } else {
        if (userStatus != "⚪") {
            userStatus = "🔵";
            app.update_status();
        }
    }
})

window.addEventListener('beforeunload', function() {
    userStatus = "⚪";
    app.update_status();
})
//#endregion