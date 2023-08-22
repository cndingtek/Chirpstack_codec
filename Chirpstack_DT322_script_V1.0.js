/***********************************************************************************************************
 * CNDINGTEK Odoo Air Sensor DT322 Codec for Chirpstack/TTN(The Things Network).
 * Version 1.3  Date 2023-08-22
 * 
 * Below is for testing purpose.Not need to put into chirpstack backend.
 * 
 ***********************************************************************************************************/
/*var test_mode = 3;
let Input = {};
let downlink = {};
switch (test_mode) {
    case 1:
        Input = {
            fPort: 3,
            //bytes: [0x80,0x00,0x02,0x02,0x15,0x06,0x55,0x00,0x00,0x01,0x6B,0xFF,0xFC,0xFF,0xF5,0xFF,0xF4,0x00,0x00,0x00,0x81],
            bytes: [0x80, 0x00, 0x22, 0x03, 0x13, 0x00, 0x03, 0x00, 0x3C, 0x1E, 0x01, 0x55, 0xDD, 0x5A, 0x00, 0x09, 0x60, 0x01, 0x81],
            //bytes: [0x80,0x00,0x22,0x01,0x12,0x00,0x1E,0x16,0x1F,0x10,0x10,0x10,0x00,0x01,0x9F,0x00,0x01,0x81],
            variables: {}
        };
        var ret = decodeUplink(Input);
        break;
    case 2:
        Input = {
            fPort: 3,
            bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x34, 0x30, 0x35, 0x38, 0x31],
            variables: {}
        };
        var ret = decodeDownlink(Input);
        break;
    case 3:
        downlink = {
            data: {
                levelThreshold: 0
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
        case 18:
            return {
                // Decoded data
                data: {
                    level: (input.bytes[5] << 8) + input.bytes[6],
                    alarmLevel: Boolean(input.bytes[11] >> 4),
                    alarmHighTemperature: (input.bytes[9] & 0x10) ? true : false,
                    alarmLowTemperature: (input.bytes[9] & 0x01) ? true : false,
                    alarmHighHumidity: (input.bytes[10] & 0x10) ? true : false,
                    alarmLowHumidity: (input.bytes[10] & 0x01) ? true : false,
                    alarmBattery: Boolean(input.bytes[12] & 0x0f),
                    temperature: input.bytes[8],
                    volt: ((input.bytes[13] << 8) + input.bytes[14]) / 100,
                    frameCounter: (input.bytes[15] << 8) + input.bytes[16],
                },
            };
        case 19:
            var high_temp_abs = input.bytes[11];
            var low_temp_abs = input.bytes[12];
            return {
                // Decoded data
                data: {
                    firmware: input.bytes[5] + "." + input.bytes[6],
                    uploadInterval: (input.bytes[7] << 8) + input.bytes[8],
                    detectInterval: input.bytes[9],
                    levelThreshold: input.bytes[10],
                    highTemperatureThreshold: input.bytes[11] > 127 ? high_temp_abs - 256 : high_temp_abs,
                    lowTemperatureThreshold: input.bytes[12] > 127 ? low_temp_abs - 256 : low_temp_abs,
                    highHumidityThreshold: input.bytes[13],
                    lowHumidityThreshold: input.bytes[14],
                    workMode: input.bytes[17],
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
        var uploadInterval_1 = uploadInterval.toString(16).padStart(4, '0').toUpperCase()[0].charCodeAt(0);
        var uploadInterval_2 = uploadInterval.toString(16).padStart(4, '0').toUpperCase()[1].charCodeAt(0);
        var uploadInterval_3 = uploadInterval.toString(16).padStart(4, '0').toUpperCase()[2].charCodeAt(0);
        var uploadInterval_4 = uploadInterval.toString(16).padStart(4, '0').toUpperCase()[3].charCodeAt(0);
        if (uploadInterval > 65535 || uploadInterval < 1) {
            return {
                errors: ['upload interval range 1-65535 minutes.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x31, uploadInterval_1, uploadInterval_2, uploadInterval_3, uploadInterval_4, 0x38, 0x31],
            };
        }
    }
    if (input.data.detectInterval != null && !isNaN(input.data.detectInterval)) {
        var detectInterval = input.data.detectInterval;
        var detectInterval_high = detectInterval.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var detectInterval_low = detectInterval.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (detectInterval > 60 || detectInterval < 1) {
            return {
                errors: ['detection interval range 1-60 minutes.'],
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
        var levelThreshold_high = levelThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var levelThreshold_low = levelThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (levelThreshold > 30 || levelThreshold < 0) {
            return {
                errors: ['Air quality alarm threshold range 0-30.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x32, levelThreshold_high, levelThreshold_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.highTemperatureThreshold != null && !isNaN(input.data.highTemperatureThreshold)) {
        var highTemperatureThreshold = input.data.highTemperatureThreshold<0?0-input.data.highTemperatureThreshold:input.data.highTemperatureThreshold;
        var highTemperatureSign=input.data.highTemperatureThreshold<0?0x31:0x30;
        var highTemperatureThreshold_high = highTemperatureThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var highTemperatureThreshold_low = highTemperatureThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (input.data.highTemperatureThreshold > 85 || input.data.highTemperatureThreshold < -30) {
            return {
                errors: ['High temperature alarm threshold range -30~+85.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x32, 0x30,highTemperatureSign,highTemperatureThreshold_high, highTemperatureThreshold_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.lowTemperatureThreshold != null && !isNaN(input.data.lowTemperatureThreshold)) {
        var lowTemperatureThreshold = input.data.lowTemperatureThreshold<0?0-input.data.lowTemperatureThreshold:input.data.lowTemperatureThreshold;
        var lowTemperatureSign=input.data.lowTemperatureThreshold<0?0x31:0x30;
        var lowTemperatureThreshold_high = lowTemperatureThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var lowTemperatureThreshold_low = lowTemperatureThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (input.data.lowTemperatureThreshold > 85 || input.data.lowTemperatureThreshold < -30) {
            return {
                errors: ['Low temperature alarm threshold range -30~+85.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x33, 0x30,lowTemperatureSign,lowTemperatureThreshold_high, lowTemperatureThreshold_low, 0x38, 0x31],
            };
        }
    }
   
    if (input.data.highHumidityThreshold != null && !isNaN(input.data.highHumidityThreshold)) {
        var highHumidityThreshold = input.data.highHumidityThreshold<0?0-input.data.highHumidityThreshold:input.data.highHumidityThreshold;       
        var highHumidityThreshold_high = highHumidityThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var highHumidityThreshold_low = highHumidityThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (input.data.highHumidityThreshold > 100 || input.data.highHumidityThreshold < 0) {
            return {
                errors: ['High humidity alarm threshold range 0~100.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x34, highHumidityThreshold_high, highHumidityThreshold_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.lowHumidityThreshold != null && !isNaN(input.data.lowHumidityThreshold)) {
        var lowHumidityThreshold = input.data.lowHumidityThreshold<0?0-input.data.lowHumidityThreshold:input.data.lowHumidityThreshold;       
        var lowHumidityThreshold_high = lowHumidityThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var lowHumidityThreshold_low = lowHumidityThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (input.data.lowHumidityThreshold > 100 || input.data.lowHumidityThreshold < 0) {
            return {
                errors: ['High humidity alarm threshold range 0~100.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x45, lowHumidityThreshold_high, lowHumidityThreshold_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.batteryThreshold != null && !isNaN(input.data.batteryThreshold)) {
        var batteryThreshold = input.data.batteryThreshold;
        var batteryThreshold_high = batteryThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var batteryThreshold_low = batteryThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (batteryThreshold > 99 || batteryThreshold < 1) {
            return {
                errors: ['Battery alarm threshold range 1-99.'],
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
        } else {
            return {
                errors: ['Work mode range 0-1.'],
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
    var valueLong = parseInt(String.fromCharCode(input.bytes[10]) + String.fromCharCode(input.bytes[11]) + String.fromCharCode(input.bytes[12]) + String.fromCharCode(input.bytes[13]), 16);
    var valueShort = parseInt(String.fromCharCode(input.bytes[10]) + String.fromCharCode(input.bytes[11]), 16);
    switch (option) {
        case 1:
            return {
                data: {
                    uploadInterval: valueLong,
                },
            };
        case 8:
            return {
                data: {
                    detectInterval: valueShort,
                },
            };
        case 2:
            return {
                data: {
                    levelThreshold: valueShort,
                },
            };
        case 3:
            return {
                data: {
                    lowTemperatureThreshold: valueLong > 255 ? 256 - valueLong : valueLong,
                },
            };
        case 4:
            return {
                data: {
                    highHumidityThreshold: valueShort,
                },
            };
        case 5:
            return {
                data: {
                    batteryThreshold: valueShort,
                },
            };
        case 15:
            return {
                data: {
                    highTemperatureThreshold: valueLong > 255 ? 256 - valueLong : valueLong,
                },
            };
        case 9:
            switch (value) {
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

