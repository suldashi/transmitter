export class PeerConnection {
	constructor(isReceiveOnly) {
		this.incomingIceBuffer = [];
		this.outgoingIceBuffer = [];
		this.canAcceptIce = false;
		this.isReceiveOnly = isReceiveOnly?isReceiveOnly:false;
		this.pc = new RTCPeerConnection();
		setInterval(() => {
			console.log(this.pc);
		},1000)
		this.localStream = null;
		this.pc.onicecandidate = (event) => {
			if(event && event.candidate) {
				this.outgoingIceBuffer.push(event.candidate);
			}
		}
	}

	addIceCandidate(candidate) {
		if(candidate) {
			if(this.canAcceptIce) {
				this.pc.addIceCandidate(candidate);	
			}
			else {
				this.incomingIceBuffer.push(candidate);
			}		
		}
	}

	onIceCandidate(callback) {
		this.pc.onicecandidate = (event) => {
			if(event && event.candidate) {
				callback(event.candidate);	
			}
		}

		for(var i in this.outgoingIceBuffer) {
			callback(this.outgoingIceBuffer[i]);
		}
		this.outgoingIceBuffer = [];
	}

	startAcceptingIce() {
		this.canAcceptIce = true;
		for(var i in this.incomingIceBuffer) {
			this.pc.addIceCandidate(this.incomingIceBuffer[i]);
		}
		this.incomingIceBuffer = [];
	}

	getRemoteStream() {
		let remoteReceivers = this.pc.getReceivers();
		return new MediaStream(remoteReceivers.map(el => el.track));
	}

	async setOffer(offer) {	
		let opts = {};
		if(this.isReceiveOnly) {
			opts.offerToReceiveVideo = true;
			opts.offerToReceiveAudio = true;
		}
		else {
			let userStream = await navigator.mediaDevices.getUserMedia({
				audio:true,
				video:true
			});
			this.pc.addStream(userStream);
		}
		
		await this.pc.setRemoteDescription(offer);
		this.startAcceptingIce();
		let answer = await this.pc.createAnswer(opts);
		await this.pc.setLocalDescription(answer);
		return answer;
	}

	async createOffer() {
		let userStream = await navigator.mediaDevices.getUserMedia({
			audio:true,
			video:true
		});
		this.localStream = userStream;
		this.pc.addStream(userStream);
		let offer = await this.pc.createOffer();
		await this.pc.setLocalDescription(offer);
		return offer;
	}

	async setAnswer(answer) {
		await this.pc.setRemoteDescription(answer);
		this.startAcceptingIce();
	}

	onConnectionComplete(callback) {
		this.pc.onconnectionstatechange = () => {
			if(this.pc.connectionState === "connected") {
				callback();
			}
		}
	}

	close() {
		this.localStream.getTracks().forEach(track => track.stop())
		this.pc.close();
	}
}

async function makeConnection() {
	let sender = new PeerConnectionSender();
	let receiver = new PeerConnectionReceiver();
	sender.onIceCandidate((candidate) => {
		receiver.addIceCandidate(candidate);
	});
	receiver.onIceCandidate((candidate) => {
		sender.addIceCandidate(candidate);
	});
	let offer = await sender.createOffer();
	let answer = await receiver.setOffer(offer);
	await sender.setAnswer(answer);
	let remoteStream = receiver.getRemoteStream();
	let sinkElement = document.getElementById("sinkElement");	
	sinkElement.srcObject = remoteStream;
}
