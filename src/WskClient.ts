
import { EventEmitter } from 'events';
import { WskWebsocket } from './WskWebsocket';
import { MessageEvent } from 'ws';

export class WskClient extends EventEmitter {

    ws: WskWebsocket;

    constructor(url: string, protocols?: string | string[]) {
        super();
        this.ws = new WskWebsocket(url, protocols);

        
        this.ws.on('passOnMessage', (e: MessageEvent) => {
            this.emit('message', e);
        });
    }

    sendRequest(method: string, params: any) {
        this.ws.sendRequest(method, params);
    }
}