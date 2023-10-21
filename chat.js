const chatId = (document.getElementById("chatId")).value;

// Query DOM
const output = document.getElementById('chat');
const btn = document.getElementById('send')
const form = document.getElementById("formId");
const isTyping = document.getElementById("is-typing");

// Query Message Information
const senderId = document.getElementById('senderId');
const senderName = document.getElementById('senderName');
const recipientId = document.getElementById('recipientId');
const recipientName = document.getElementById('recipientName');
const message = document.getElementById('message');



// Make Connection
const socket = io.connect("http://localhost:3000", {
    transports: ["websocket","webtransport"],
    addTrailingSlash: false,
});

// join room 
socket.emit("chat-room", chatId)


// Emit Events 
btn.addEventListener('click', function(){
    socket.emit('chat', {
        room: chatId,
        senderId: senderId.value,
        senderName: senderName.value,
        recipientId: recipientId.value,
        recipientName: recipientName.value,
        message: message.value,
    });
});

message.addEventListener('keypress', function(){
    socket.emit('typing', {
        typer: senderName.value,
        room: chatId
    })
})


// Listening for emit 
socket.on('chat', function(data){
    isTyping.innerHTML = ""
    output.innerHTML += "<p>"+ data.senderName+ ":" + data.message+"</p>";
    if (message.value === "") {
        isTyping.innerHTML = ""
    }
});

socket.on('disconnect', function(){
    socket.emit('disconeected',{
        text: "disconnected"
    })
    console.log("user that disconnected:" + socket.id);
});

socket.on('typing', function(data){
    isTyping.innerHTML = "<p><em>"+ data.typer +" is typing...</em></p>"
    if (message.value === "") {
        isTyping.innerHTML = ""
    }
});