
import * as Websocket from 'ws';
import * as jsonrpc from 'jsonrpc-lite';

export class WskClient extends Websocket {

    uid!: string;
    isAlive: boolean = false;
    
    constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        
        this.onmessage = (e: Websocket.MessageEvent) => {
            console.log('DATA!', e.data);
            /* const parsedMessage: any = jsonrpc.parse(JSON.parse(e.data));
            console.log('payload!', parsedMessage);

            const payload: any = parsedMessage.payload;

            if (payload) {
                switch(payload.method) {
                    case 'WSK_assignID':
                        this.assignID(payload);
                        break;
                }
            } */
        }
    }

    assignID(payload: any) {
        this.uid = payload.uid;

        console.log('UID ASSIGNED!', this.uid);
    }
}