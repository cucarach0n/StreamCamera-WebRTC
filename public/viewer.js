
//const peerConnection = {};
const peerConnections = {};
const config = {
  iceServers: [
      //{ 
      //  "urls": "stun:stun.l.google.com:19302",
      //},
       { 
         "urls": "turn:turn.soporgram.com:3478",
         "username": "cucaracha",
         "credential": "4583013"
       }
  ]
};


var divVideo = document.getElementById('videos');

const socket = io.connect(window.location.origin);
const video = document.querySelector("video");
const enableAudioButton = document.querySelector("#enable-audio");

//enableAudioButton.addEventListener("click", enableAudio)
var videoNew = document.createElement("video");
var idStream = [];
socket.on("offer", (id, description) => {

  var tagVideo = document.createElement("video");
  tagVideo.setAttribute('class',"col col-12 col-sm-10 col-md-6 col-lg-4");
  tagVideo.setAttribute('controls','');
  tagVideo.setAttribute('autoplay','');
  tagVideo.setAttribute('playsinline','');
  tagVideo.setAttribute('muted','');
  tagVideo.setAttribute('id',id);
  var peerConnection = new RTCPeerConnection(config);
  //peerConnection[id] = peerConnection;

  peerConnection.addEventListener('datachannel', event => {
      const dataChannel = event.channel;
      dataChannel.addEventListener('message', event => {
        console.log('Message from DataChannel "' + dataChannel.label + '" payload "' + event.data + '"');
        document.getElementById('txtMensaje').value = event.data;
      });
  });

  peerConnections[id] = peerConnection;
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      console.log(peerConnection.localDescription);
      socket.emit("answer", id, socket.id, peerConnection.localDescription);
    });
    peerConnection.oniceconnectionstatechange = event =>{
      console.log("Estado de conexión: " + peerConnection.iceConnectionState + " id: " + id);
      if (peerConnection.iceConnectionState === "disconnected") {
        //divVideo.childNodes().map(x=>x.id == id).remove();
        document.getElementById(id).remove();
        peerConnections[id].close();
        console.log('Streamer con id '+id+' desconectado');
      }/*else if(peerConnection.iceConnectionState === "checking") {
        document.getElementById(id).remove();

      }*/
    };
    //abriendo datachannel

    /*videoNew.setAttribute('playsinline', '');
    videoNew.setAttribute('autoplay', '');
    videoNew.setAttribute('muted', '');
    divVideo.appendChild(videoNew); */ 
    
  peerConnection.ontrack = event => {
    console.log('agregando nuevo track');
    console.log(event.streams);
    if (document.getElementById(id) != null) {
      document.getElementById(id).remove();
    }
    
    /*var tagVideo = document.createElement("video");
    tagVideo.setAttribute('controls','');
    tagVideo.srcObject = event.streams[0];
    divVideo.appendChild(tagVideo);
    idStream.push(event.streams[0].id);*/
    //addVideoStream(tagVideo, event.streams[0]);
    //video.srcObject = event.streams[0];
    tagVideo.srcObject = event.streams[0];
    divVideo.appendChild(tagVideo);
  };
  
  /*peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };*/
});



socket.on("candidate", (id, candidate) => {
  /*peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));*/
    console.log(peerConnections[id]);
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));  
});

socket.on("connect", () => {
  //socket.emit("watcher");
  socket.emit("conectar",'viewer');
});

socket.on("addNewStream", (solicitud,idStream) => {
  console.log('agregando nuevo stream con id: ' + idStream);
  //esperarConexionTimer(Math.random() * 4000);
  socket.emit("nuevaSolicitud",solicitud,idStream,false);
})


/*socket.on("broadcaster", () => {
  socket.emit("watcher");
});*/

socket.on("broadcaster", (idStream) => {
  //setTimeout con milisegundos aleatorios para evitar que se envien las peticiones al mismo tiempo
  //setTimeout(function(){socket.emit("watcher",idStream);}, Math.floor(Math.random() * 1000));
  socket.emit("watcher",idStream);

});

window.onunload = window.onbeforeunload = () => {
  
  socket.close();
  peerConnection.close();
};

function enableAudio() {
  console.log("Enabling audio")
  video.muted = false;
}

function addVideoStream(_video,stream){
  _video.srcObject = stream;
  
  videoNew.append(_video);
}