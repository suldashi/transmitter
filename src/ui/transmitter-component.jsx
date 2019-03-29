import React from "react";
import { PeerConnection } from "./peer/peer-connection";

const autoBind = require("react-auto-bind");

export class TransmitterComponent extends React.Component {
    constructor(props) {
        super(props);
        this.socket = props.socket;
        autoBind(this);
        this.state = {
            loading:true,
            registered:false,
            projector:null
        }
    }

    componentDidMount() {
        this.socket.on("transmitterRegisteredSuccessfully",async (data) => {
            this.setState({
                loading:false,
                registered:true,
                projector:data.projector
            });
            if(data.projector) {
                await this.startTransmission();
            }
        });
        this.socket.on("transmitterRegistrationFailed",() => {
            this.setState({
                loading:false
            });
        });
        this.socket.on("projectorConnected",async (data) => {
            this.setState({
                projector:data.projector
            });
            await this.startTransmission();
        });
        this.socket.on("projectorDisconnected",() => {
            this.setState({
                projector:null
            });
            this.endTransmission();
        });
        this.socket.on("incomingIceCandidateFromProjector",(data) => {
            this.pc.addIceCandidate(data.candidate);
        })
        this.socket.on("incomingAnswerFromProjector",async (data) => {
            await this.pc.setAnswer(data.answer);
        })
        this.socket.emit("registerTransmitter");
    }

    endTransmission() {
        if(this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }

    async startTransmission() {
        this.pc = new PeerConnection();
        this.pc.onIceCandidate((candidate) => {
            this.socket.emit("sendIceCandidateToProjector",{candidate});
        });
        let offer = await this.pc.createOffer();
        this.stream = this.pc.localStream;
        this.socket.emit("sendOfferToProjector",{offer});
    }

    render() {
        if(this.state.loading) {
            return <h1>Loading...</h1>;
        }
        else {
            if(this.state.registered) {
                if(this.state.projector) {
                    return <h1>Projector is active!</h1>
                }
                else {
                    return <h1>Transmitter registered successfully, waiting for projector...</h1>
                }
            }
            else {
                return <h1>Could not register the transmitter screen, possibly some other screen is already using it</h1>;
            }
        }
        
    }
}