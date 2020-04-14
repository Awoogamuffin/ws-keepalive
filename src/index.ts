export { WskClient } from "./WskClient";
export { WskServer } from "./wskServer";

export function logMessage(msg?: string) {
    return 'LOGGING MESSAGE FROM PACKAGE! ' + (msg || '');
}