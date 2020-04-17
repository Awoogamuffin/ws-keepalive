
import { EventEmitter } from 'events';
import { WskWebsocket } from './WskWebsocket';
import { MessageEvent } from 'ws';
import { ConsoleWriter } from 'istanbul-lib-report';

export class WskClient extends EventEmitter {

    ws!: WskWebsocket;

    heartbeatTimeout: any;
    heartbeatValue: number = 10000;

    url: any;
    protocols: any;

    connectedToServer = false;

    constructor(url: string, protocols?: string | string[]) {
        super();

        this.url = url;
        this.protocols = protocols;

        this.startConnection();
    }

    sendRequest(method: string, params: any) {
        if (this.ws.readyState !== this.ws.OPEN) {
            console.warn('trying to send when socket not connected');
            return;
        }
        this.ws.sendRequest(method, params);
    }

    startConnection() {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
        }

        this.ws = new WskWebsocket(this.url, this.protocols);

        this.ws.onopen = (e) => {
            console.log('ON OPEN!');
            this.emit('open');
            this.connectedToServer = true;
            this.checkHeartbeat();
        }

        this.ws.on('ping', () => {
            this.ws.isAlive = true;
        });

        this.ws.on('passOnMessage', (e: MessageEvent) => {
            this.emit('message', e);
        });

        this.ws.onclose = (e) => {
            console.log('on close!');
            this.reconnectSocket();
        }

        this.ws.onerror = (e) => {
            console.warn('socket error', e);
            this.connectedToServer = false;
            this.ws.close();
        }
    }

    checkHeartbeat() {
        this.heartbeatTimeout = setTimeout(() => {
            if (!this.ws.isAlive) {
                console.warn('lost connection to master server');
                this.connectedToServer = false;
                this.ws.close();
                return;
            }
            this.ws.isAlive = false;
            this.checkHeartbeat();
        }, this.heartbeatValue);
    }

    reconnectSocket() {
        console.log('reconnecting socket');
        this.connectedToServer = false;
        setTimeout(() => {
            this.startConnection();
        }, 2000)
    }
}