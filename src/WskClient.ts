import * as Websocket from 'ws';
import * as jsonrpc from 'jsonrpc-lite';

export class WskClient extends WebSocket {

    uid!: string;
    isAlive: boolean = false;

    constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        
        this.onmessage = (e: MessageEvent) => {
            const payLoad = jsonrpc.parse(e.data);
            console.log('payload!', payLoad);
        };
    }
}