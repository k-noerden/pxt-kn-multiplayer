
/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="\uf11b" block="KN multiplayer"
namespace knmultiplayer {
    const MP_START = 0;
    const MP_JOIN = 1;
    const MP_SENDER_WON = 2;
    const MP_SENDER_LOST = 3;
    let myRandom = 0;
    let _isRunning = false;
    let _isGameOver = false;
    let _isGameOverCommunicated = false;
    let otherRandom: number = null;

    let _player: number = null;
    let buffer: Buffer;
    /**
     * Start a new multiplayer game
     */
    //% block="Start multiplayer"
    export function startMultiplayer() {
        basic.showLeds(`0 0 0 0 1
0 0 1 0 1
1 0 1 0 1
0 0 1 0 1
0 0 0 0 1`, 10);

        myRandom = randint(0, 255);
        _isRunning = false;
        otherRandom = null;
        _player = null;

        // console.log(control.deviceSerialNumber() + ": startMultiplayer " + myRandom);
        radio.setTransmitSerialNumber(true);
        radio.onReceivedBuffer(_receive);
        buffer = control.createBuffer(2);
        buffer[0] = MP_START;
        buffer[1] = myRandom;
        radio.sendBuffer(buffer);
    }
    function _receive(incomming: Buffer) {
        // if (radio.lastPacket.serial == control.deviceSerialNumber()) {
        //     console.log(control.deviceSerialNumber() + ": _receive received packet from self");
        //     while (true) {
        //     }
        // }
        let action = incomming[0];
        let otherRandom = incomming[1];

        // console.log(control.deviceSerialNumber() + ": _receive " + action + " " + otherRandom + " from " + radio.lastPacket.serial);
        if (action === MP_START) {
            myRandom = randint(0, 255);
            while (myRandom === otherRandom) {
                myRandom = randint(0, 255);
            }
            // console.log(control.deviceSerialNumber() + ": send JOIN " + myRandom);
            buffer[0] = MP_JOIN;
            buffer[1] = myRandom;
            radio.sendBuffer(buffer);

            if (myRandom < otherRandom) {
                _player = 0;
            } else {
                _player = 1;
            }
            _isRunning = true;
        } else if (action === MP_JOIN) {
            if (otherRandom === myRandom) {
                // console.log(control.deviceSerialNumber() + ": knmultiplayer: bad join");
                while (true) {
                    basic.showIcon(IconNames.Sad);
                    basic.showString("knmultiplayer: bad join");
                }
                // myRandom = randint(0, 255);
                // buffer[0] = MP_START; // The other micro:bit made a mistake
                // buffer[1] = myRandom
                // radio.sendBuffer(buffer);
                // return;
            }
            if (myRandom < otherRandom) {
                _player = 0;
            } else {
                _player = 1;
            }
            _isRunning = true;
        } else if (action === MP_SENDER_WON) {
            _isGameOverCommunicated = true;
            gameOver(GameOverState.Lost);
        }  else if (action === MP_SENDER_LOST) {
            _isGameOverCommunicated = true;
            gameOver(GameOverState.Won);

        } else {

        }
    }


    /**
     *
     */
    //% block="is multiplayer running"
    export function isRunning(): boolean {
        return _isRunning;
    }


    /**
     *
     */
    //% block="player"
    export function player(): number {
        if (_player === null) {
            while (true) {
                basic.showIcon(IconNames.Sad);
                basic.showString("knmultiplayer: bad join");
            }
        }
        return _player;
    }
    /**
     *
     */
    //% block="is primary"
    export function isPrimary(): boolean {
        return _player === 0;
    }


    export enum GameOverState {
        //% block=Won
        Won,
        //% block=Lost
        Lost,
    }
    /**
     *
     */
    //% block="game over %state"
    export function gameOver(state: GameOverState): void {
        _isRunning = false;
        if (!_isGameOver) {
            if (!_isGameOverCommunicated) {
                _isGameOverCommunicated = true;
                if (state === GameOverState.Won) {
                    buffer[0] = MP_SENDER_WON;
                } else {
                    buffer[0] = MP_SENDER_LOST;
                }
                buffer[1] = 0;
                radio.sendBuffer(buffer);
            }
            _isGameOver = true;
            game.pause();
            input.onButtonPressed(Button.A, () => { });
            input.onButtonPressed(Button.B, () => { });
            input.onButtonPressed(Button.AB, () => {
                control.reset();
            });
            led.stopAnimation();
            led.setBrightness(255);

            let score = game.score();
            let text;
            if (state === GameOverState.Won) {
                text = " WON ";
            } else {
                text = " LOST ";
            }
            while (true) {
                basic.clearScreen();
                basic.showString(text);
                basic.showNumber(score, 100);
                basic.showString(" ");
            }


        } else {
            // already in gameOver in another fiber
            while (true) {
                basic.pause(10000);
            }
        }
    }
}
