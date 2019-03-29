let connectedUsers = {};
let projector = null;
let transmitter = null;
let controlPanel = null;

function socketHandler(io) {
    io.on("connection",(socket) => {
        socket.on("disconnect",() => {
            if(projector === socket) {
                projector = null;
                if(transmitter) {
                    transmitter.emit("projectorDisconnected");
                }
                if(controlPanel) {
                    controlPanel.emit("projectorDisconnected");
                }
            }
            if(transmitter === socket) {
                transmitter = null;
                if(projector) {
                    projector.emit("transmitterDisconnected");
                }
            }
            if(controlPanel === socket) {
                controlPanel = null;
            }
        });

        socket.on("registerProjector",(data) => {
            if(projector) {
                socket.emit("projectorRegistrationFailed")
            }
            else {
                projector = socket;
                socket.emit("projectorRegisteredSuccessfully",{transmitter:transmitter?transmitter.id:null});
                if(transmitter) {
                    transmitter.emit("projectorConnected",{projector:projector.id})
                }
                if(controlPanel) {
                    controlPanel.emit("projectorConnected",{projector:projector.id})
                }
            }
        });

        socket.on("registerControlPanel",(data) => {
            if(controlPanel) {
                socket.emit("controlPanelRegistrationFailed")
            }
            else {
                controlPanel = socket;
                socket.emit("controlPanelRegisteredSuccessfully",{projector:projector?projector.id:null});
            }
        });

        socket.on("registerTransmitter",(data) => {
            if(transmitter) {
                socket.emit("transmitterRegistrationFailed")
            }
            else {
                transmitter = socket;
                socket.emit("transmitterRegisteredSuccessfully",{projector:projector?projector.id:null});
                if(projector) {
                    projector.emit("transmitterConnected",{transmitter:transmitter.id})
                }
            }
        });

        socket.on("sendOfferToProjector",(data) => {
            if(projector) {
                projector.emit("incomingOfferFromTransmitter",{offer:data.offer});
            }
        });

        socket.on("sendIceCandidateToProjector",(data) => {
            if(projector) {
                projector.emit("incomingIceCandidateFromTransmitter",{candidate:data.candidate});
            }
        });

        socket.on("sendIceCandidateToTransmitter",(data) => {
            if(transmitter) {
                transmitter.emit("incomingIceCandidateFromProjector",{candidate:data.candidate});
            }
        });

        socket.on("sendAnswerToTransmitter",(data) => {
            if(transmitter) {
                transmitter.emit("incomingAnswerFromProjector",{answer:data.answer});
            }
        });

        socket.on("ctrlSendCommand",(data) => {
            if(projector) {
                projector.emit("ctrlSendCommand",data);
            }
        })
    });
    
}

module.exports = socketHandler;