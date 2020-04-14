import { logMessage } from ".";

test('I\'m getting the hang of testing, I hope... ', () => {
    expect(logMessage('Michael')).toBe('LOGGING MESSAGE FROM PACKAGE! Michael');
    expect(logMessage()).toBe('LOGGING MESSAGE FROM PACKAGE! ');
});