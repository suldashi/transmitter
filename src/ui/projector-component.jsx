import React from "react";
import { PeerConnection } from "./peer/peer-connection";

const autoBind = require("react-auto-bind");

export class ProjectorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.socket = props.socket;
        this.videoRef = React.createRef();
        this.overlayOptions = {
            "video":this.switchToVideo.bind(this),
            "main":this.switchToMain.bind(this),
            "welcome":this.switchToWelcome.bind(this)
        };
        autoBind(this);
        this.state = {
            loading:true,
            registered:false,
            transmitter:false,
            videoActive: false,
            mainActive: false,
            welcomeActive:true
        }
    }

    componentDidMount() {
        this.socket.on("projectorRegisteredSuccessfully",(data) => {
            this.setState({
                loading:false,
                registered:true,
                transmitter:data.transmitter
            });
            if(data.transmitter) {
                this.startPeerConnection();
            }
        });
        this.socket.on("projectorRegistrationFailed",() => {
            this.setState({
                loading:false
            });
        });
        this.socket.on("transmitterConnected",(data) => {
            this.setState({
                transmitter:data.transmitter
            });
            this.startPeerConnection();
        });
        this.socket.on("transmitterDisconnected",() => {
            this.setState({
                transmitter:null
            });
        });
        this.socket.on("incomingOfferFromTransmitter",async (data) => {
            let answer = await this.pc.setOffer(data.offer);
            this.socket.emit("sendAnswerToTransmitter",{answer});
        });
        this.socket.on("incomingIceCandidateFromTransmitter",(data) => {
            this.pc.addIceCandidate(data.candidate);
        });
        this.socket.on("ctrlSendCommand",(data) => {
            console.log("we got a command",data);
                this.overlayOptions[data.command](data);
        });
        this.socket.emit("registerProjector");
    }

    startPeerConnection() {
        this.pc = new PeerConnection(true);
        this.pc.onIceCandidate((candidate) => {
            this.socket.emit("sendIceCandidateToTransmitter",{candidate});
        });
        this.pc.onConnectionComplete(() => {
            this.videoRef.current.srcObject = this.pc.getRemoteStream()
        });
    }

    endPeerConnection() {
        if(this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }

    mainProjector() {
        return <div className={this.state.mainActive?"projector-active projector-main":"projector-hidden"}>
            <div className="center-spacer">
                <h1>DEBUGC<span style={{"color":"rgb(95,34,253)"}}>&#123;&#125;</span><span className="last-letter">N</span></h1>
                <h2>30 Mars 2019 - Prishtinë, Kosovë</h2>
            </div>
            <h3 className="bottom-left">debug.al</h3>
            <h3 className="bottom-right"><img className="bottom-logo" src="/public/img/logo.svg" /></h3>
        </div>
    }

    welcomeProjector() {
        return <div className={this.state.welcomeActive?"projector-active projector-welcome":"projector-hidden"}>
            <div className="middle-container">
                <h1 className="rtl">SESIONI I<br/>LIGJERATAVE</h1>
                <h2>Kohëzgjatja e sesionit:<br/>9:30 - 10:30</h2>
            </div>
            <h3 className="bottom-left">debug.al</h3>
            <h3 className="bottom-right"><img className="bottom-logo" src="/public/img/logo.svg" /></h3>
        </div>
    }

    activeProjector() {
        return <div>
            <video autoPlay width="1920" height="1080" className={this.state.videoActive?"projector-active projector-video":"projector-hidden"} ref={this.videoRef}></video>
            <this.mainProjector />
            <this.welcomeProjector />
        </div>;
    }

    switchToVideo(data) {
        this.setState({
            videoActive: true,
            mainActive: false,
            welcomeActive: false
        });
    }

    switchToMain(data) {
        this.setState({
            videoActive: false,
            mainActive: true,
            welcomeActive: false
        });
    }

    switchToWelcome(data) {
        this.setState({
            videoActive: false,
            mainActive: false,
            welcomeActive: true
        });
    }

    render() {
        if(this.state.loading) {
            return <h1>Loading...</h1>;
        }
        else {
            if(this.state.registered) {
                if(this.state.transmitter) {
                    return <this.activeProjector />
                }
                else {
                    return <h1>Projector registered successfully, waiting for transmitter...</h1>
                }
            }
            else {
                return <h1>Could not register the projector screen, possibly some other screen is already using it</h1>;
            }
        }
        
    }
}