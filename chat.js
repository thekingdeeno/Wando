const chatId = (document.getElementById("chatId")).value;

// Query DOM
const output = document.getElementById('chat');
const btn = document.getElementById('send')
const form = document.getElementById("formId");

// Query Message Information
const senderId = document.getElementById('senderId');
const senderName = document.getElementById('senderName');
const recipientId = document.getElementById('recipientId');
const recipientName = document.getElementById('recipientName');
const message = document.getElementById('message');

console.log("qwerty")


// Make Connection
const socket = io.connect("http://localhost:3000", {
    // path: '/chat/',
    // addTrailingSlash: false,
});

// Emit Events 
btn.addEventListener('click', function(){
    console.log('hello');
    socket.emit('chat', {
        senderId: senderId.value,
        senderName: senderName.value,
        recipientId: recipientId.value,
        recipientName: recipientName.value,
        message: message.value,
    });
});


// Listening for emit 
socket.on('chat', function(data){
    output.innerHTML += "<p>"+ data.senderName+ ":" + data.message+"</p>";
});

socket.on('disconnect', function(){
    console.log(`User that disconnected: ${socket.id}`);
});