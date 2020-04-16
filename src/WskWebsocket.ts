
import * as Websocket from 'ws';
import * as jsonrpc from 'jsonrpc-lite';
import * as shortid from 'shortid';

export class WskWebsocket extends Websocket {

    uid!: string;
    isAlive: boolean = false;

    requestTimeouts: any = {};
    timeoutValue = 10000;

    constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        
        this.onmessage = (e: Websocket.MessageEvent) => {
            const datarpc: any = jsonrpc.parse(e.data as string);
            const payload: any = datarpc.payload;

            switch (datarpc.type) {
                case 'request': 
                    switch(datarpc.payload.method) {
                        case 'WSK_assignUID':
                            this.assignID(payload.params);
                            if (datarpc.type === 'request') {
                                this.sendOKResponse(payload.id);
                            }
                            break;

                        default:
                            this.emit('passOnMessage', datarpc);
                    }
                    break;
                
                case 'invalid':
                    console.warn('received invalid json', jsonrpc);
                    break;
            }
        };
    }

    assignID(params: any) {
        if (params) {
            this.uid = params.uid;
            console.log('UID ASSIGNED!', this.uid);
        } else {
            console.warn('no uid provided in params');
        }
    }

    sendOKResponse(requestID: any) {
        const payload: any = jsonrpc.success(requestID, 'OK');
        this.send(JSON.stringify(payload));
    }

    sendRequest(method: string, params: any) {
        console.log('sending websocket request');
        const requestID = shortid.generate();
        const payload = jsonrpc.request(requestID, method, params);
        this.send(JSON.stringify(payload));

        this.requestTimeouts[requestID] = setTimeout(() => {
            delete this.requestTimeouts[requestID];
            console.warn('request timed out: ', payload);
        }, this.timeoutValue)
    }
}