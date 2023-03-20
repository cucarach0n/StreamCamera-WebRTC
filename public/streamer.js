const peerConnections = {};
const config = {
  iceServers: [
    { 
      "urls": "stun:stun.l.google.com:19302",
    },
    // { 
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ]
};
var reloadStream = false;
var IdLastViewer = 0;
var listViewers = [];

var dataChannels = [];

var btnTransmitir = document.getElementById('btnTransmitir');
var solicitud = false;
const socket = io.connect(window.location.origin);
var localStream;

var localStreams = [];

var videoEtiqueta = document.getElementById('vdoPlay');

socket.on("answer", (id, description) => {
  console.log(description);
  peerConnections[id].setRemoteDescription(description);
});
document.getElementById('btnEnviar').addEventListener('click',()=>{
  var mensaje = document.getElementById('txtMensaje').value;
  for (var i = 0; i < dataChannels.length; i++) {
    console.log(dataChannels[i]);
    dataChannels[i].send(mensaje);
  }
  document.getElementById('txtMensaje').value = '';
});
socket.on("watcher", id => {
  
  var peerConnection = new RTCPeerConnection(config);
  
  const dataChannel = peerConnection.createDataChannel("chat");
  
  dataChannel.addEventListener('open', event => {
    console.log('DataChannel "' + dataChannel.label + '" esta abierto');
  });
  console.log(dataChannel);
  // Disable input when closed
  dataChannel.addEventListener('close', event => {
    listaDataChannelsNuevo = [];
    for (var i = 0; i < dataChannels.length; i++) {
      if(dataChannels[i]!= dataChannel){
        var temp = dataChannels[i];
        listaDataChannelsNuevo.push(temp);
      }
    }
    dataChannels = listaDataChannelsNuevo;

  });
  dataChannels.push(dataChannel);
  localStreams.push(localStream);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStreams[localStreams.length-1]));
  
  
  peerConnections[id] = peerConnection;
  console.log(peerConnections);
  /*let stream = localStream;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));*/
  
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
    
});

/*socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});*/

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
  listaViewersNuevo = [];
  for (var i = 0; i < listViewers.length; i++) {
    if(listViewers[i]!= id){
      listaViewersNuevo.push(listViewers[i]);
    }
  }
  listViewers = listaViewersNuevo;
  console.log('desconectando');
  
});

window.onunload = window.onbeforeunload = () => {
  
  socket.close();
};

// Get camera and microphone
const videoElement = document.querySelector("video");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");
//videoElement.style.display = 'none';
audioSelect.onchange = ()=>{getStream()};
videoSelect.onchange = ()=>{getStream()};

/*getStream()
  .then(getDevices)
  .then(gotDevices);
*/
function getDevices() {
  
  return navigator.mediaDevices.enumerateDevices();
}
var flagDevice = false;
function gotDevices(deviceInfos) {

  if(flagDevice){
    return;
  }
  flagDevice = true;
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
}

window.addEventListener('load', function() {
  getDevices().then(gotDevices);
});

function getStream() {
  //reloadStream = reload;
  
  /*navigator.mediaDevices.getUserMedia = (navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webKitGetUserMedia
    || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.msgGetUserMedia);
*/
  /*if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }*/
  /*if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop();
    });
  }*/
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  };
  console.log("Obteniendo stream");
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
  
}

function gotStream(stream) {
  localStream = stream;
  //videoEtiqueta.srcObject = stream;
  //window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );
  videoSelect.selectedIndex = [...videoSelect.options].findIndex(
    option => option.text === stream.getVideoTracks()[0].label
  );
  //videoElement.srcObject = stream;
  //socket.emit("broadcaster",IdLastViewer);
  console.log("Trata de iniciar conexion")
  iniciarConexion();
}




function iniciarConexion(){

  if(localStream == null){
    console.log('no hay stream' + 'con id ' + IdLastViewer);
    /*getStream(false)
      .then(getDevices)
      .then(gotDevices);*/
  }
  else{
    console.log('hay stream' + 'con id ' + IdLastViewer);
  }
  if(reloadStream == false){
    console.log('iniciando conexion con un viewer');
    socket.emit("broadcaster",IdLastViewer);
  }
  else{
    console.log('iniciando conexion con varios viewers');
    for(var i = 0; i < listViewers.length; i++){
      socket.emit("broadcaster",listViewers[i]);
    }
    
  }
  
  //socket.emit("broadcaster",IdLastViewer);
}

function validarStatusStream(){

  if (solicitud ==false) {
    
    if(localStream){
      
      /*localStream.getTracks().forEach(track => {
        track.stop();
      });*/
      for(var i = 0;i < localStreams.length; i++){
        localStreams[i].getTracks().forEach(track => {
          track.stop();
        });
      }
      console.log('cerrando stream');
      console.log(localStream);
      localStream = null;
      btnTransmitir.dataset.estado = 'true';
      btnTransmitir.innerText = "Transmitir video"
    };
  }else{
    
    btnTransmitir.dataset.estado = 'false';
      btnTransmitir.innerText = "Parar transmicion"
    getStream()
      .then(getDevices)
      .then(gotDevices);
    
  }
  console.log('validando estado de stream');
};
btnTransmitir.addEventListener('click',()=>{
  if (btnTransmitir.dataset.estado == "true") {
    btnTransmitir.innerText = "Parar transmicion";

      getStream()
        .then(getDevices)
        .then(gotDevices);
        btnTransmitir.dataset.estado = 'false';
  }
  else{
    btnTransmitir.innerText = "Transmitir video";
    if(localStream != null){
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      btnTransmitir.dataset.estado ="true";
    };
    
  }
});

function esperarConexion(){
  console.log("iniciando conexion timeout")
};

socket.on('solicitudstream', function (estado,idViewer,streamer) {
  
  /*console.log('Recibiendo solicitud de stream de ' + idViewer + ' con solicitud ' + solicitud + ' y estado ' + estado); 
  IdLastViewer = idViewer;
  listViewers.push(idViewer);
  if (solicitud != estado) {
    console.log("validando solicitud a " + estado);
    solicitud = estado;
    
    validarStatusStream();
    
  }
  else{
    console.log('Iniciando conexion, solicitud validada');
    
    iniciarConexion();
  }*/
  reloadStream = streamer;
  console.log("Recibiendo solicitud de streamer :" +  streamer);
  console.log('Recibiendo solicitud de streamer :' + idViewer + ' con solicitud ' + solicitud + ' y estado ' + estado); 
  IdLastViewer = idViewer;
  listViewers.push(idViewer);
  if (solicitud != estado){
    console.log("Cambiando Estado a " + estado);
  }
  solicitud = estado;
  validarStatusStream();
});



socket.on("connect", () => {
  //socket.emit("watcher")
  console.log('Conectado al servidor de CD');
  socket.emit("conectar",'streamer');
});


socket.on('test',(value)=>{
  console.log(value);
});
function handleError(error) {
  console.error("Error: ", error);
}