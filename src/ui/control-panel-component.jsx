import React from "react";
import { PeerConnection } from "./peer/peer-connection";

const autoBind = require("react-auto-bind");

export class ControlPanelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.socket = props.socket;
        autoBind(this);
        this.state = {
            projector: false,
            registered: false,
            loading: true
        }
    }

    componentDidMount() {
        this.socket.on("controlPanelRegisteredSuccessfully",(data) => {
            this.setState({
                loading:false,
                registered:true,
                projector:data.projector
            });
        });
        this.socket.on("controlPanelRegistrationFailed",() => {
            this.setState({
                loading:false
            });
        });
        this.socket.on("projectorConnected",(data) => {
            this.setState({
                projector:data.projector
            });
        });
        this.socket.on("projectorDisconnected",() => {
            this.setState({
                projector:null
            });
        });
        this.socket.emit("registerControlPanel");
    }

    switchToVideo() {
        this.socket.emit("ctrlSendCommand",{command:"video"});
    }

    switchToMain() {
        this.socket.emit("ctrlSendCommand",{command:"main"});
    }

    switchToWelcome() {
        this.socket.emit("ctrlSendCommand",{command:"welcome"});
    }

    switchToSponsors() {
        this.socket.emit("ctrlSendCommand",{command:"sponsors"});
    }

    switchToSession1() {
        this.socket.emit("ctrlSendCommand",{command:"session",params:{sessionNr:1}});
    }

    switchToSession2() {
        this.socket.emit("ctrlSendCommand",{command:"session",params:{sessionNr:2}});
    }

    switchToSession3() {
        this.socket.emit("ctrlSendCommand",{command:"session",params:{sessionNr:3}});
    }

    switchToSession4() {
        this.socket.emit("ctrlSendCommand",{command:"session",params:{sessionNr:4}});
    }

    controlPanel() {
        return <div>
            <button onClick={this.switchToVideo}>Switch to Video</button>
            <button onClick={this.switchToMain}>Switch to Main</button>
            <button onClick={this.switchToWelcome}>Switch to Welcome</button>
        </div>;
    }

    render() {
        if(this.state.loading) {
            return <h1>Loading...</h1>;
        }
        else {
            if(this.state.registered) {
                if(this.state.projector) {
                    return <this.controlPanel />
                }
                else {
                    return <h1>Control panel registered registered successfully, waiting for projector...</h1>
                }
            }
            else {
                return <h1>Could not register the control panel, possibly some other screen is already using it</h1>;
            }
        }
        
    }
}