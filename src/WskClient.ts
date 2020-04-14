export class WskClient extends WebSocket {

    isAlive: boolean = false;

    constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
    }
}