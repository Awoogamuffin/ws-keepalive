export { WskClient } from "./WskClient";
export { WskServer } from "./wskServer";
export { WskWebsocket } from "./WskWebsocket";

export function logMessage(msg?: string) {
    return 'LOGGING MESSAGE FROM PACKAGE! ' + (msg || '');
}