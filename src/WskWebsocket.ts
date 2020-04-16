
import * as Websocket from 'ws';
import * as jsonrpc from 'jsonrpc-lite';

export class WskWebsocket extends Websocket {

    uid!: string;
    isAlive: boolean = false;

    constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);

        console.log('creating wsk client AGAIN');
        
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

    sendRequest(data: any) {

    }
}