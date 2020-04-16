import * as WebSocket from 'ws';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import * as shortid from 'shortid';
import { EventEmitter } from 'events';
import { WskClient } from './WskClient';
import jsonrpc from 'jsonrpc-lite';
import { WskWebsocket } from './WskWebsocket';
export class WskServer extends EventEmitter {

    wss: WebSocket.Server;

    private requestTimeouts: any = {};
    timeoutValue: number = 10000;

    assignUIDs = false;

    /**
     * Contructor automatically gets the server listening and sets it up to ping clients to ensure the
     * connection stays alive
     * @param port port number for the server
     * @param certificatePath optional paramater necessary for an ssl server. Path to certificates.
     * @param domain optional paramater necessary for an ssl server. Name of domain
     */

    constructor(port: number, certificatePath?: string, domain?: string) {
        super();
        let server: https.Server | http.Server;
        if (certificatePath && domain) {
            try {
                server = this.createSecureServer(certificatePath, domain);
            } catch(e) {
                throw('failed to create ssl server');
            }
        } else {
            server = http.createServer();
        }
        
        this.wss = new WebSocket.Server({ server });
        server.listen(port);

        console.log('webserver created');

        this.wss.on('connection', (ws: WskWebsocket) => {

            if (this.assignUIDs) {
                const clientUID: any = shortid.generate();
                this.sendRequest(ws, 'WSK_assignUID', { uid: clientUID });
            }
            
            ws.on('message', (d: WebSocket.Data) => {
                console.log('RECEIVED DATA FROM CLIENT', d);
                const datarpc: any = jsonrpc.parse(d as string);
                console.log('datarpc', datarpc);

                switch (datarpc.type) {
                    case 'success':
                        this.handleSuccess(datarpc.payload);
                        break;

                    case 'request':
                        this.handleRequest(ws, datarpc);
                        break;
                }
            });
        });
    }

    /**
     * Function to create a server with ssl certificates if necessary.
     * @param certificatePath path to where the certificate files are kept
     * @param domain domain name that the certificate is for.
     */

    createSecureServer(certificatePath: string, domain: string): https.Server {
        const credentials: any = {};
        credentials.key = fs.readFileSync(`${certificatePath}/${domain}/privkey.pem`, 'utf8');
        credentials.cert = fs.readFileSync(`${certificatePath}/${domain}/cert.pem`, 'utf8');
        credentials.ca = fs.readFileSync(`${certificatePath}/${domain}/chain.pem`, 'utf8');
        
        return https.createServer(credentials);
    }

    /**
     * Send a message to a client and await a response.
     * @param client the websocket to send a message to
     * 
     * @param method name of method to run
     * @param params params to send to method
     */

    sendRequest(ws: WskWebsocket, method: string, params: any) {
        const requestID = shortid.generate();
        const payload = jsonrpc.request(requestID, method, params);
        ws.send(JSON.stringify(payload));

        this.requestTimeouts[requestID] = setTimeout(() => {
            delete this.requestTimeouts[requestID];
            console.warn('request timed out: ', payload);
        }, this.timeoutValue)
    }


    /**
     * Clears timeout on requests
     * @param data data received from client
     */
    handleSuccess(data: any) {
        if (data.id) {
            clearTimeout(this.requestTimeouts[data.id]);
            delete this.requestTimeouts[data.id];
            console.log('received', data.result);
        }
    }


    handleRequest(ws: WskWebsocket, datarpc: any) {
        this.emit('message', { ws: ws, datarpc: datarpc });
    }
}