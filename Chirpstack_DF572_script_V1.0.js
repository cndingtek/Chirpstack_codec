/***********************************************************************************************************
 * CNDINGTEK radar Level sensor DF572 Codec for Chirpstack/TTN(The Things Network).
 * Version 1.0  Date 2021-12-3
 * 
 * Below is for testing purpose.Not need to put into chirpstack backend.
 * 
 ***********************************************************************************************************/
var test_mode = 1;
let Input = {};
let downlink = {};
switch (test_mode) {
    case 1:
        Input = {
            fPort: 3,
            //bytes: [0x80,0x00,0x17,0x02,0x16,0x1C,0x43,0x02,0xFD,0x00,0x00,0x00,0x18,0x42,0x10,0x00,0x01,0x67,0x00,0x01,0x00,0x81],
            //bytes: [0x80,0x00,0x07,0x02,0x14,0x0F,0xDC,0x01,0xCD, 0x03, 0xE9, 0x42, 0xEF, 0x27, 0x20, 0x42,0x00,0x00,0x1B,0x33,0x01,0x00,0x01,0x6E,0x00,0x01,0x00,0x81],
            bytes: [0x80, 0x00, 0x17, 0x03, 0x15, 0x01, 0x02,  0x18, 0x0A, 0x1F,0x40, 0x1E, 0x4B,0x1E, 0x14, 0x00, 0x00, 0x64,0x00, 0x00, 0x81],
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
        case 21:
            return {
                // Decoded data
                data: {
                    firmware: input.bytes[5] + "." + input.bytes[6],
                    uploadInterval: input.bytes[7],
                    detectInterval: input.bytes[8],
                    InstallHeight: (input.bytes[9] << 8) + input.bytes[10],
                    levelThreshold: input.bytes[11],
                    temperatureThreshold: input.bytes[12],
                    batteryThreshold: input.bytes[14],
                    liquidDropMode: input.bytes[15],
                    liquidDropThreshold: (input.bytes[16] << 8) + input.bytes[17],
                    workMode: input.bytes[18],
                },
            };

        case 22:
            return {
                // Decoded data
                data: {
                    liquidLevel: (input.bytes[5] << 8) + input.bytes[6],
                    airHeight: (input.bytes[7] << 8) + input.bytes[8],
                    alarmLevel: Boolean(input.bytes[14] >> 4),
                    alarmDrop: Boolean(input.bytes[14] & 0x0f),
                    alarmTemperature: Boolean(input.bytes[15]>>4),
                    alarmBattery: Boolean(input.bytes[15] & 0x0f),
                    temperature: input.bytes[12],
                    humidity: input.bytes[13],
                    volt: ((input.bytes[16] << 8) + input.bytes[17]) / 100,
                    frameCounter: (input.bytes[18] << 8) + input.bytes[19],
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
    if (input.data.levelThreshold != null && !isNaN(input.data.levelThreshold)&&input.data.InstallHeight != null && !isNaN(input.data.InstallHeight)) {
        var levelThreshold = input.data.levelThreshold;
        var levelThreshold_1 = levelThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var levelThreshold_2 = levelThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);

       
    
        var installHeight = input.data.InstallHeight;
        var installHeight_1 = installHeight.toString(16).padStart(4, '0').toUpperCase()[0].charCodeAt(0);
        var installHeight_2 = installHeight.toString(16).padStart(4, '0').toUpperCase()[1].charCodeAt(0);
        var installHeight_3 = installHeight.toString(16).padStart(4, '0').toUpperCase()[2].charCodeAt(0);
        var installHeight_4 = levelThinstallHeightreshold.toString(16).padStart(4, '0').toUpperCase()[3].charCodeAt(0);

        return {
            // LoRaWAN FPort used for the downlink message
            fPort: 3,
            // Encoded bytes
            bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x32, installHeight_1, installHeight_2, installHeight_3, installHeight_4,0x30,0x30, levelThreshold_1,levelThreshold_2,0x38, 0x31],
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
            var value8 = parseInt(String.fromCharCode(input.bytes[14]) + String.fromCharCode(input.bytes[15]) + String.fromCharCode(input.bytes[16]) + String.fromCharCode(input.bytes[17]), 16);
            return {
                data: {
                    levelThreshold: value8,
                    installHeight: value4,
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

