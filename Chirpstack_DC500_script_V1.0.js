/***********************************************************************************************************
 * CNDINGTEK People Counter DC500 Codec for Chirpstack/TTN(The Things Network).
 * Version 1.0  Date 2023-5-7
 * 
 * Below is for testing purpose.Not need to put into chirpstack backend.
 * 
 ***********************************************************************************************************/
/*var test_mode = 1;
let Input = {};
let downlink = {};
switch (test_mode) {
    case 1:
        Input = {
            fPort: 3,
            bytes: [0x80, 0x00, 0x01, 0x03, 0x0C, 0x01, 0x03, 0x04, 0x01, 0xF4, 0x1E, 0x81],
            //bytes: [0x80,0x00,0x02,0x01,0x15,0x01,0x01,0x01,0x00,0x01,0x6F,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x81],            
            variables: {}
        };
        var ret = decodeUplink(Input);
        break;
    case 2:
        Input = {
            fPort: 3,
            bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x46, 0x38, 0x31],
            variables: {}
        };
        var ret = decodeDownlink(Input);
        break;
    case 3:
        downlink = {
            data: {
                reset: 1
            }
        };
        var ret = encodeDownlink(downlink);
        break;
    default:
        break;
}

console.log(ret);*/
/************************************************************************************
 * 
 * Below are functions for codec which should put into Chirpstack backend.
 *   
 * *********************************************************************************/
//IEEE754 hex to float convert
function hex2float(num) {
    var sign = num & 0x80000000 ? -1 : 1;
    var exponent = ((num >> 23) & 0xff) - 127;
    var mantissa = 1 + (num & 0x7fffff) / 0x7fffff;
    return sign * mantissa * Math.pow(2, exponent);
}

function decodeUplink(input) {
    if (input.fPort != 3) {
        return {
            errors: ['unknown FPort'],
        };
    }
    switch (input.bytes.length) {
        case 21:
            return {
                // Decoded data
                data: {
                    peopleCounter: ((input.bytes[5] << 8) + input.bytes[6]),
                    alarmCounter: Boolean(input.bytes[7] & 0xF0),
                    alarmBattery: Boolean(input.bytes[7] & 0x0F),                    
                    volt: ((input.bytes[9] << 8) + input.bytes[10]) / 100,
                    frameCounter: (input.bytes[17] << 8) + input.bytes[18],
                },
            };
        case 12:
            return {
                // Decoded data
                data: {
                    firmware: input.bytes[5] + "." + input.bytes[6],
                    uploadInterval: input.bytes[7],
                    batteryThreshold: input.bytes[10],
                    peopleCounterThreshold: (input.bytes[8] << 8) + input.bytes[9],
                },
            };
        default:
            return {
                errors: ['wrong length'],
            };
    }
}

// Encode downlink function.
//
// Input is an object with the following fields:
// - data = Object representing the payload that must be encoded.
// - variables = Object containing the configured device variables.
//
// Output must be an object with the following fields:
// - bytes = Byte array containing the downlink payload.
function encodeDownlink(input) {
    if (input.data.uploadInterval != null && !isNaN(input.data.uploadInterval)) {
        var uploadInterval = input.data.uploadInterval;
        var uploadInterval_high = uploadInterval.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var uploadInterval_low = uploadInterval.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (uploadInterval > 168 || uploadInterval < 1) {
            return {
                errors: ['upload interval range 1-168 hours.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x31, uploadInterval_high, uploadInterval_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.peopleCounterThreshold != null && !isNaN(input.data.peopleCounterThreshold)) {
        var peopleCounterThreshold = input.data.peopleCounterThreshold;
        var peopleCounter_1st = peopleCounterThreshold.toString(16).padStart(4, '0').toUpperCase()[0].charCodeAt(0);
        var peopleCounter_2nd = peopleCounterThreshold.toString(16).padStart(4, '0').toUpperCase()[1].charCodeAt(0);
        var peopleCounter_3rd = peopleCounterThreshold.toString(16).padStart(4, '0').toUpperCase()[2].charCodeAt(0);
        var peopleCounter_4th = peopleCounterThreshold.toString(16).padStart(4, '0').toUpperCase()[3].charCodeAt(0);
        if (peopleCounterThreshold > 65535 || peopleCounterThreshold < 1) {
            return {
                errors: ['people counter range 1-65535.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x32, peopleCounter_1st, peopleCounter_2nd, peopleCounter_3rd, peopleCounter_4th, 0x38, 0x31],
            };
        }
    }

    if (input.data.batteryThreshold != null && !isNaN(input.data.batteryThreshold)) {
        var batteryThreshold = input.data.batteryThreshold;
        var batteryThreshold_high = batteryThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var batteryThreshold_low = batteryThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (batteryThreshold > 99 || batteryThreshold < 5) {
            return {
                errors: ['battery alarm threshold range 5-99.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x35, batteryThreshold_high, batteryThreshold_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.zeroPeopleCounter != null && !isNaN(input.data.zeroPeopleCounter)) {
        var zeroPeopleCounter = input.data.zeroPeopleCounter;
        if (zeroPeopleCounter != 1) {
            return {
                errors: ['zero people counter: 1.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x46, 0x38, 0x31],
            };
        }
    }    
    return {
        errors: ['invalid downlink parameter.'],
    };
}

function decodeDownlink(input) {
    var input_length = input.bytes.length;
    if (input.fPort != 3) {
        return {
            errors: ['invalid FPort.'],
        };
    }

    if (
        input_length < 12 ||
        input.bytes[0] != 0x38 ||
        input.bytes[1] != 0x30 ||
        input.bytes[2] != 0x30 ||
        input.bytes[3] != 0x32 ||
        input.bytes[4] != 0x39 ||
        input.bytes[5] != 0x39 ||
        input.bytes[6] != 0x39 ||
        input.bytes[7] != 0x39 ||
        input.bytes[input_length - 2] != 0x38 ||
        input.bytes[input_length - 1] != 0x31
    ) {
        return {
            errors: ['invalid format.'],
        };
    }
    var option = parseInt(String.fromCharCode(input.bytes[8]) + String.fromCharCode(input.bytes[9]), 16);
    if (input_length == 16)
        var value = parseInt(String.fromCharCode(input.bytes[10]) + String.fromCharCode(input.bytes[11]) + String.fromCharCode(input.bytes[12]) + String.fromCharCode(input.bytes[13]), 16);
    else
        var value = parseInt(String.fromCharCode(input.bytes[10]) + String.fromCharCode(input.bytes[11]), 16);
    switch (option) {
        case 1:
            return {
                data: {
                    uploadInterval: value,
                },
            };
        case 2:
            return {
                data: {
                    peopleCounterThreshold: value,
                },
            };
        case 5:
            return {
                data: {
                    batteryThreshold: value,
                },
            };

        case 9:
            switch (value) {                
                case 0x0F:
                    return {
                        data: {
                            zeroPeopleCounter: 1,
                        },
                    };
                default:
                    return {
                        errors: ['invalid parameter value.'],
                    };
            }
        default:
            return {
                errors: ['invalid parameter key.'],
            };
    }
}

