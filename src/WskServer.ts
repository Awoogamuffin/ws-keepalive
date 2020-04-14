import * as WebSocket from 'ws';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { EventEmitter } from 'events';
export class WskServer extends EventEmitter {

    wss: WebSocket.Server;

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

        this.wss.on('connection', (ws: WebSocket) => {
            ws.send(JSON.stringify('Successfully connected to WSK server'));
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
}