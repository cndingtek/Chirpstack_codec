/***********************************************************************************************************
 * CNDINGTEK radar Level sensor DF570 Codec for Chirpstack/TTN(The Things Network).
 * Version 1.0  Date 2024-8-12
 * 
 * Below is for testing purpose.Not need to put into chirpstack backend.
 * 
 ***********************************************************************************************************/
var test_mode = 3;
let Input = {};
let downlink = {};
switch (test_mode) {
    case 1:
        Input = {
            fPort: 3,
            //bytes: [0x80,0x00,0x07,0x02,0x14,0x0F,0xDC,0x00,0x00,0x00,0x1B,0x33,0x01,0x00,0x01,0x6E,0x00,0x01,0x00,0x81],
            //bytes: [0x80,0x00,0x07,0x02,0x14,0x0F,0xDC,0x01,0xCD, 0x03, 0xE9, 0x42, 0xEF, 0x27, 0x20, 0x42,0x00,0x00,0x1B,0x33,0x01,0x00,0x01,0x6E,0x00,0x01,0x00,0x81],
            bytes: [0x80, 0x00, 0x07, 0x03, 0x13, 0x01, 0x04, 0x01, 0x18, 0x00, 0x1E, 0x00, 0x14, 0x14, 0x00, 0x0A, 0x00, 0x00, 0x81],
            variables: {}
        };
        var ret = decodeUplink(Input);
        break;
    case 2:
        Input = {
            fPort: 3,
            bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x32, 0x30, 0x31, 0x30, 0x31, 0x38, 0x31],
            variables: {}
        };
        var ret = decodeDownlink(Input);
        break;
    case 3:
        downlink = {
            data: {
                levelThreshold: 300
            }
        };
        var ret = encodeDownlink(downlink);
        break;
    default:
        break;
}
console.log(ret);
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
        case 19:
            return {
                // Decoded data
                data: {
                    firmware: input.bytes[5] + "." + input.bytes[6],
                    uploadInterval: input.bytes[7],
                    detectInterval: input.bytes[8],
                    levelThreshold: (input.bytes[9] << 8) + input.bytes[10],
                    temperatureThreshold: input.bytes[11],
                    batteryThreshold: input.bytes[13],
                    workMode: input.bytes[14],
                },
            };

        case 20:
            return {
                // Decoded data
                data: {
                    level: (input.bytes[5] << 8) + input.bytes[6],
                    alarmLevel: Boolean(input.bytes[12] >> 4),
                    alarmTemperature: Boolean(input.bytes[12] & 0x0f),
                    alarmBattery: Boolean(input.bytes[13] & 0x0f),
                    temperature: input.bytes[10],
                    humidity: input.bytes[11],
                    volt: ((input.bytes[14] << 8) + input.bytes[15]) / 100,
                    frameCounter: (input.bytes[16] << 8) + input.bytes[17],
                },
            };

        case 28:
            return {
                // Decoded data
                data: {
                    level: (input.bytes[5] << 8) + input.bytes[6],
                    alarmLevel: Boolean(input.bytes[20] >> 4),
                    alarmTemperature: Boolean(input.bytes[20] & 0x0f),
                    alarmBattery: Boolean(input.bytes[21] & 0x0f),
                    longitude: hex2float((input.bytes[11] << 24) + (input.bytes[10] << 16) + (input.bytes[9] << 8) + input.bytes[8]).toFixed(6),
                    latitude: hex2float((input.bytes[15] << 24) + (input.bytes[14] << 16) + (input.bytes[13] << 8) + input.bytes[12]).toFixed(6),
                    temperature: input.bytes[18],
                    humidity: input.bytes[19],
                    volt: ((input.bytes[22] << 8) + input.bytes[23]) / 100,
                    frameCounter: (input.bytes[24] << 8) + input.bytes[25],
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
        if (uploadInterval > 255 || uploadInterval < 1) {
            return {
                errors: ['upload interval range 1-255 hours.'],
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
    if (input.data.detectInterval != null && !isNaN(input.data.detectInterval)) {
        var detectInterval = input.data.detectInterval;
        var detectInterval_high = detectInterval.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var detectInterval_low = detectInterval.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (detectInterval > 255 || detectInterval < 1) {
            return {
                errors: ['detection interval range 1-255 minutes.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x38, detectInterval_high, detectInterval_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.levelThreshold != null && !isNaN(input.data.levelThreshold)) {
        var levelThreshold = input.data.levelThreshold;
        var levelThreshold_1 = levelThreshold.toString(16).padStart(4, '0').toUpperCase()[0].charCodeAt(0);
        var levelThreshold_2 = levelThreshold.toString(16).padStart(4, '0').toUpperCase()[1].charCodeAt(0);
        var levelThreshold_3 = levelThreshold.toString(16).padStart(4, '0').toUpperCase()[2].charCodeAt(0);
        var levelThreshold_4 = levelThreshold.toString(16).padStart(4, '0').toUpperCase()[3].charCodeAt(0);

        return {
            // LoRaWAN FPort used for the downlink message
            fPort: 3,
            // Encoded bytes
            bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x32, levelThreshold_1, levelThreshold_2, levelThreshold_3, levelThreshold_4, 0x38, 0x31],
        };

    }
    if (input.data.temperatureThreshold != null && !isNaN(input.data.temperatureThreshold)) {
        var temperatureThreshold = input.data.temperatureThreshold;
        var temperatureThreshold_high = temperatureThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var temperatureThreshold_low = temperatureThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (temperatureThreshold > 255 || temperatureThreshold < 1) {
            return {
                errors: ['Temperature alarm threshold range 1-255.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x33, temperatureThreshold_high, temperatureThreshold_low, 0x38, 0x31],
            };
        }
    }
   
    if (input.data.batteryThreshold != null && !isNaN(input.data.batteryThreshold)) {
        var batteryThreshold = input.data.batteryThreshold;
        var batteryThreshold_high = batteryThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var batteryThreshold_low = batteryThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (batteryThreshold > 99 || batteryThreshold < 5) {
            return {
                errors: ['Battery alarm threshold range 5-99.'],
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
   
    if (input.data.gpsEnable != null && !isNaN(input.data.gpsEnable)) {
        var gpsEnable = input.data.gpsEnable;
        if (gpsEnable == true || gpsEnable == 1) {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x31, 0x38, 0x31],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x30, 0x38, 0x31],
            };
        }
    }
    if (input.data.workMode != null && !isNaN(input.data.workMode)) {
        var workMode = input.data.workMode;
        if (workMode === 0) {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x35, 0x38, 0x31],
            };
        } else if (workMode === 1) {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x36, 0x38, 0x31],
            };
        } else if (workMode === 2) {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x45, 0x38, 0x31],
            };
        } else {
            return {
                errors: ['Work mode range 0-2.'],
            }
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
    var value = parseInt(String.fromCharCode(input.bytes[10]) + String.fromCharCode(input.bytes[11]), 16);
    var value4 = parseInt(String.fromCharCode(input.bytes[10]) + String.fromCharCode(input.bytes[11]) + String.fromCharCode(input.bytes[12]) + String.fromCharCode(input.bytes[13]), 16);
    switch (option) {
        case 1:
            return {
                data: {
                    uploadInterval: value,
                },
            };
        case 8:
            return {
                data: {
                    detectInterval: value,
                },
            };
        case 2:
            return {
                data: {
                    levelThreshold: value4,
                },
            };
        case 3:
            return {
                data: {
                    temperatureThreshold: value,
                },
            };
        case 4:
            return {
                data: {
                    fallThreshold: value,
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
                case 0x00:
                    return {
                        data: {
                            gpsEnable: 0,
                        },
                    };
                case 0x01:
                    return {
                        data: {
                            gpsEnable: 1,
                        },
                    };
                case 0x02:
                    return {
                        data: {
                            reset: 1,
                        },
                    };
                case 0x05:
                    return {
                        data: {
                            workMode: 0,
                        },
                    };
                case 0x06:
                    return {
                        data: {
                            workMode: 1,
                        },
                    };
                case 0x0E:
                    return {
                        data: {
                            workMode: 2,
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

