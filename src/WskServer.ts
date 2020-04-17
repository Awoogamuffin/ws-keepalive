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

    wss!: WebSocket.Server;
    port: number;

    private requestTimeouts: any = {};
    timeoutValue: number = 10000;
    pingValue: number = 4000;

    websocketsByUID: any = {};

    server: https.Server | http.Server;

    /**
     * Contructor automatically gets the server listening and sets it up to ping clients to ensure the
     * connection stays alive
     * @param port port number for the server
     * @param certificatePath optional paramater necessary for an ssl server. Path to certificates.
     * @param domain optional paramater necessary for an ssl server. Name of domain
     */

    constructor(port: number, certificatePath?: string, domain?: string) {
        super();
        this.port = port;
        if (certificatePath && domain) {
            try {
                this.server = this.createSecureServer(certificatePath, domain);
            } catch(e) {
                throw('failed to create ssl server');
            }
        } else {
            this.server = http.createServer();
        }

        this.createServer();
    }

    private createServer() {
        // creating 
        const server = this.server;
        this.wss = new WebSocket.Server({ server });
        this.server.listen(this.port);

        console.log('webserver created');

        this.wss.on('connection', (ws: WskWebsocket) => {

            ws.isAlive = true;

            const clientUID: any = shortid.generate();
            this.sendRequest(ws, 'WSK_assignUID', { uid: clientUID });
            ws.uid = clientUID;
            this.websocketsByUID[clientUID] = ws.uid;
            
            ws.on('message', (d: WebSocket.Data) => {
                console.log('RECEIVED DATA FROM CLIENT', d);
                const datarpc: any = jsonrpc.parse(d as string);
                console.log('datarpc', datarpc);

                switch (datarpc.type) {
                    case 'success':
                        this.handleSuccess(datarpc.payload);
                        break;

                    case 'request':
                        this.handleRequest(ws as WskWebsocket, datarpc);
                        break;
                }
            });

            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('close', () => {
                delete this.websocketsByUID[ws.uid];
            })
        });

        setInterval(() => {
            this.wss.clients.forEach((wso: WebSocket) => {
                const ws: WskWebsocket = wso as WskWebsocket;
                if (!ws.isAlive) {
                    return ws.terminate();
                }

                ws.isAlive = false;
                if (ws && ws.readyState === ws.OPEN) {
                    try {
                        ws.ping(null, false);
                    } catch(e) {
                        console.warn('error while sending to client', e);
                    }
                }
            })
        }, this.pingValue);
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
        if (!(ws && ws.readyState && ws.readyState === ws.OPEN)) {
            console.warn('trying to send to websocket that isn\'t open');
            return;
        }
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
        console.log('emitting!', datarpc);
        this.emit('message', { wsUID: ws.uid, datarpc: datarpc });
    }

    getWS(id: string): WskWebsocket | undefined {
        return this.websocketsByUID[id];
    }
}