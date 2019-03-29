import React from "react";
import { PeerConnection } from "./peer/peer-connection";

const autoBind = require("react-auto-bind");

export class HomeComponent extends React.Component {
    constructor(props) {
        super(props);
        this.socket = props.socket;
        this.channelParticipants = {};
        autoBind(this);
        this.state = {
            activeStreams:[]
        }
    }

    componentDidMount() {
        this.socket.on("joinChannel",(data) => {
            for(var i in data) {
                this.channelParticipants[data[i]] = {id:data[i]};
            }
        })
        this.socket.on("userJoined",async (data) => {
            this.channelParticipants[data] = {id:data};
            let pc = new PeerConnection();
            this.channelParticipants[data].pc = pc;
            pc.onIceCandidate((candidate) => {
                this.socket.emit("sendIceCandidate",{candidate,target:data});
            });
            let offer = await pc.createOffer();
            this.socket.emit("sendOffer",{target:data,offer});
        });
        this.socket.on("userLeft",(data) => {
            delete this.channelParticipants[data];
            if(this.state.activeStreams[data]) {
                this.setState((prevState) => {
                    let newStreams = prevState.activeStreams;
                    var index = newStreams.indexOf(data);
                    if (index > -1) {
                        newStreams.splice(index, 1);
                    }
                    return {
                        activeStreams:newStreams
                    }
                })
            }
        });
        this.socket.on("incomingOffer",async (data) => {
            let sender = data.sender;
            let pc = new PeerConnection(true);
            pc.onConnectionComplete(() => {
                this.setState((prevState) => {
                    let newStreams = prevState.activeStreams;
                    newStreams.push(data.sender);
                    return {
                        activeStreams:newStreams
                    }
                })
            });
            this.channelParticipants[sender].pc = pc;
            pc.onIceCandidate((candidate) => {
                this.socket.emit("sendIceCandidate",{candidate,target:sender});
            });
            let answer = await pc.setOffer(data.offer);
            this.socket.emit("sendAnswer",{target:sender,answer});
        });
        this.socket.on("incomingAnswer", async (data) => {
            let sender = data.sender;
            await this.channelParticipants[sender].pc.setAnswer(data.answer);
        })
        this.socket.on("incomingIceCandidate",(data) => {
            let sender = data.sender;
            this.channelParticipants[sender].pc.addIceCandidate(data.candidate);
        });
        this.socket.emit("joinChannel");
    }

    renderStream(pcId) {
        let remoteStream = this.channelParticipants[pcId].pc.getRemoteStream();
        let videoEl = <video autoPlay ref={video => {video.srcObject = remoteStream}} width="1920" height="1080" src={remoteStream} key={pcId}></video>
        return videoEl;
    }

    render() {
        return <div>
            {this.state.activeStreams.map((el) => this.renderStream(el))}
        </div>;
    }
}