import React from "react";
import { Switch, Route, Link } from 'react-router-dom'
import {HomeComponent} from './home-component';
import {ProjectorComponent} from './projector-component';
import {TransmitterComponent} from './transmitter-component';
import {ControlPanelComponent} from './control-panel-component';
import {NotFoundComponent} from './not-found-component';

const io = require("socket.io-client");
const autoBind = require("react-auto-bind");

export class MainComponent extends React.Component {
    constructor(props) {
        super(props);
        autoBind(this);
        this.socket = io();
    }

    render() {
        return <div>
            <Switch>
                <Route exact path="/" component={this.ControlPanelComponentWithProps} />
                <Route exact path="/projector" component={this.ProjectorComponentWithProps} />
                <Route exact path="/transmitter" component={this.TransmitterComponentWithProps} />
                <Route exact path="*" component={this.NotFoundComponentWithProps} />
            </Switch>
        </div>;
    }

    HomeComponentWithProps() {
        return <HomeComponent socket={this.socket} />
    }

    ProjectorComponentWithProps() {
        return <ProjectorComponent socket={this.socket} />
    }

    TransmitterComponentWithProps() {
        return <TransmitterComponent socket={this.socket} />
    }

    ControlPanelComponentWithProps() {
        return <ControlPanelComponent socket={this.socket} />
    }

    NotFoundComponentWithProps() {
        return <NotFoundComponent />
    }
}