const express = require("express");
const app = express();

let broadcaster = [];
const port = 3000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));
var conectados = [];
var solicitudLast = false;
io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {
  socket.on("broadcaster", (idViewer) => {
    //id del emisor del stream
    //broadcaster = socket.id;
    
    //socket.broadcast.emit("broadcaster", socket.id);
    socket.to(idViewer).emit("broadcaster",socket.id);
  });
  socket.on("watcher", (idStreamer) => {
    //socket.to(broadcaster).emit("watcher", socket.id);
    //socket.to(id).emit("watcher", socket.id);
    /*for(var i = 0; i < broadcaster.length; i++){
      socket.to(broadcaster[i]).emit("watcher", socket.id);
    }*/
    socket.to(idStreamer).emit("watcher", socket.id);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id,iDWatcher, message) => {
    
    
    socket.to(id).emit("answer", iDWatcher, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  function esperarConexionTimer(time,conectado,solicitud,id){
    setTimeout(function(){
      console.log("Enviado conexion");
      socket.to(conectado).emit('addNewStream',solicitud,id);
    },time);
  };
  //socket.to(socket.id).emit('test',true);
  socket.on("conectar", (tipo) => {
    var solicitud = false;
        if (tipo == "viewer") {
            if(conectados.length == 0)
            {
                conectados.push({id:socket.id,area:tipo}); 
                solicitud = true;
            }
            else{
                solicitud = true;
                if(conectados.filter(conectados=>conectados.id == socket.id)[0] != null){
                    conectados.filter(conectados=>conectados.id == socket.id)[0].id = socket.id;
                }
                else{
                    conectados.push({id:socket.id,area:tipo});
                }
            }
            solicitud = true;
            //socket.broadcast.emit('solicitudstream',solicitud,socket.id);
            for(var i = 0; i < broadcaster.length; i++){
              socket.to(broadcaster[i]).emit("solicitudstream", solicitud,socket.id,false);
              
            }
            //socket.broadcast.emit('solicitudstream',true);   
        }
        else if(tipo == "streamer"){
            var existe = false;
            
            for(var i = 0;i < broadcaster.length; i++){
              if(broadcaster[i] == socket.id){
                existe = true;
              }  
            }
            if(existe == false){
              broadcaster.push(socket.id);
              
            }
            //solicitud = conectados.length > 0;
            if (conectados.length > 0) {
                solicitud = true;
                
                //socket.broadcast.emit('solicitudstream',true);
            }else{
                solicitud = false;
                //socket.broadcast.emit('solicitudstream',false);
            }
            //recorrer la lista de conectados y enviar solicitud a cada uno
            
            var time = 0;
            /*for(var conectado of conectados){
            
              //socket.to(conectado.id).emit('addNewStream',solicitud,socket.id);
              
              console.log("enviando solicitud a " + conectado.id);
              esperarConexionTimer(time,conectado.id,solicitud,socket.id);
              time += 5000;
                
            }*/ 
            for(var conectado of conectados){
              socket.to(conectado.id).emit('addNewStream',solicitud,socket.id);
            }
            /*for(var i = 0; i < conectados.length; i++){
                socket.to(socket.id).emit('solicitudstream',solicitud,conectados[i].id);
            }*/
        }
        
        console.log("total viewers conectados: " + conectados.length);
        console.log("total broadcasters conectados: " + broadcaster.length)
        console.log("broadcast enviado por " + tipo+"-"+socket.id);

  });
  socket.on("nuevaSolicitud", (solicitud,id,streamer) => {
    console.log("Recibiendo solicitud de " + socket.id + " para " + id + " con valor " + solicitud);
    socket.to(id).emit("solicitudstream",solicitud,socket.id,streamer);
  });
  socket.on("disconnect", () => {
    var listaNueva = conectados.filter(conectados => conectados.id != socket.id);
    var listaNuevaBroadcast = [];
    var esStreamer = false;
    for(var i = 0; i < broadcaster.length; i++){
      if(broadcaster[i] != socket.id){
        listaNuevaBroadcast.push(broadcaster[i]);
      }
      else{
        esStreamer = true;
      }
    }
    broadcaster = listaNuevaBroadcast;
    if(esStreamer == false){
      
      /*if (listaNueva.length > 0) {
          socket.broadcast.emit('solicitudstream',true,true);
        
      }else{
          socket.broadcast.emit('solicitudstream',false,true);
      
      }*/

      

      for(var i = 0; i < broadcaster.length; i++){
        socket.to(broadcaster[i]).emit("disconnectPeer",socket.id);
      }
      conectados = listaNueva;
      if (conectados.length == 0) 
      {
          socket.broadcast.emit('solicitudstream',false,socket.id,true);
      
      }
    }
    /*else{
      for(var i = 0; i < broadcaster.length; i++){
        
      }
    }*/

		
    //eliminar el broadcaster de la lista
    
        	
    console.log("total viewers conectados: " + conectados.length);
    console.log("total broadcasters conectados: " + broadcaster.length)
  });

});
server.listen(port, () => console.log(`Server is running on port ${port}`));
