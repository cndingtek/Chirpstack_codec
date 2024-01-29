/***********************************************************************************************************
 * Ultrasonic+Magnet Parking Lots Detector DO201 Codec for Chirpstack/TTN(The Things Network).
 * Version 1.0  Date 2024-1-29
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
            //bytes: [0x80, 0x00, 0x31, 0x02, 0x17, 0x06, 0xB4, 0x00, 0x00, 0x01, 0x61, 0x00, 0x10, 0xFF, 0xF6, 0xFF, 0xF0, 0x8B, 0x2D, 0x00, 0x01, 0x00, 0x81],
            //bytes: [0x80, 0x00, 0x01, 0x02, 0x0D, 0x01, 0x02, 0x18, 0x0A, 0x14, 0x19, 0x00, 0x81],
            bytes: [0x80, 0x00, 0x31, 0x03, 0x10, 0x01, 0x01, 0x18, 0x1E, 0x3C, 0x00, 0x3C, 0x14, 0x00, 0x00, 0x81],
            variables: {}
        };
        var ret = decodeUplink(Input);
        break;
    case 2:
        Input = {
            fPort: 3,
            bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x46, 0x30, 0x30, 0x33, 0x33, 0x38, 0x31],
            variables: {}
        };
        var ret = decodeDownlink(Input);
        break;
    case 3:
        downlink = {
            data: {
                magnetThreshold: 15
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
var units = [' ℃', ' hours', ' minutes', ' mm', ' °', ' cm'];
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
        case 23:
            var mag_x = (input.bytes[11] << 8) + input.bytes[12];
            var mag_y = (input.bytes[13] << 8) + input.bytes[14];
            var mag_z = (input.bytes[15] << 8) + input.bytes[16];
            var rawTemperature = input.bytes[17];
            return {
                // Decoded data
                data: {
                    level: (input.bytes[5] << 8) + input.bytes[6],
                    volt: ((input.bytes[9] << 8) + input.bytes[10]) / 100,
                    alarmPark: Boolean(input.bytes[7] >> 4),
                    alarmLevel: Boolean(input.bytes[7] & 0x0f),
                    alarmMagnet: Boolean(input.bytes[8] >> 4),
                    alarmBattery: Boolean(input.bytes[8] & 0x0f),
                    xMagnet: mag_x > 32767 ? mag_x - 65536 :
                        mag_x,
                    yMagnet: mag_y > 32767 ? mag_y - 65536 :
                        mag_y,
                    zMagnet: mag_z > 32767 ? mag_z - 65536 :
                        mag_z,
                    temperature: rawTemperature > 127 ? rawTemperature - 256 : rawTemperature,
                    humidity: input.bytes[18],
                    frameCounter: (input.bytes[19] << 8) + input.bytes[20],
                },
            };

        case 16:
            var data_type = input.bytes[3];
            if (data_type === 0x03) {
                return {
                    // Decoded parameter
                    data: {
                        firmware: input.bytes[5] + "." + input.bytes[6],
                        uploadInterval: input.bytes[7],
                        detectInterval: input.bytes[8],
                        levelThreshold: input.bytes[9],
                        magnetThreshold: (input.bytes[10] << 8) + input.bytes[11],
                        batteryThreshold: input.bytes[12],
                    },
                };
            }
        default:
            return {
                errors: ['wrong length'],
            };
    }
}

function encodeDownlink(input) {
    if (input.data.uploadInterval != null && !isNaN(input.data.uploadInterval)) {
        var periodic_interval = input.data.uploadInterval;
        var periodic_interval_high = periodic_interval.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var periodic_interval_low = periodic_interval.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (periodic_interval > 168 || periodic_interval < 1) {
            return {
                errors: ['periodic upload interval range 1-168 hours.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x31, periodic_interval_high, periodic_interval_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.detectionInterval != null && !isNaN(input.data.detectionInterval)) {
        var detection_interval = input.data.detectionInterval;
        var detection_interval_high = detection_interval.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var detection_interval_low = detection_interval.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (detection_interval > 60 || detection_interval < 1) {
            return {
                errors: ['ultra detection interval range 1-60 minutes.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x38, detection_interval_high, detection_interval_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.levelThreshold != null && !isNaN(input.data.levelThreshold)) {
        var levelThreshold = input.data.levelThreshold;
        var levelThreshold_high = levelThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var levelThreshold_low = levelThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (levelThreshold > 255 || levelThreshold < 15) {
            return {
                errors: ['battery alarm threshold range 15-255 %.'],
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
    if (input.data.magnetThreshold != null && !isNaN(input.data.magnetThreshold)) {
        var magnetThreshold = input.data.magnetThreshold;
        var magnetThreshold_1 = magnetThreshold.toString(16).padStart(4, '0').toUpperCase()[0].charCodeAt(0);
        var magnetThreshold_2 = magnetThreshold.toString(16).padStart(4, '0').toUpperCase()[1].charCodeAt(0);
        var magnetThreshold_3 = magnetThreshold.toString(16).padStart(4, '0').toUpperCase()[2].charCodeAt(0);
        var magnetThreshold_4 = magnetThreshold.toString(16).padStart(4, '0').toUpperCase()[3].charCodeAt(0);
        if (magnetThreshold > 65535 || magnetThreshold < 1) {
            return {
                errors: ['magnet threshold range 1-65535.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x46, magnetThreshold_1, magnetThreshold_2, magnetThreshold_3, magnetThreshold_4, 0x38, 0x31],
            };
        }


    }

    if (input.data.batteryThreshold != null && !isNaN(input.data.batteryThreshold)) {
        var batteryThreshold = input.data.batteryThreshold;
        var batteryThreshold_high = batteryThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var batteryThreshold_low = batteryThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (batteryThreshold > 99 || batteryThreshold < 5) {
            return {
                errors: ['battery alarm threshold range 5-99 %.'],
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
    var value2Bytes = parseInt(String.fromCharCode(input.bytes[10]) + String.fromCharCode(input.bytes[11]) + String.fromCharCode(input.bytes[12]) + String.fromCharCode(input.bytes[13]), 16);
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
                    levelThreshold: value,
                },
            };
        case 5:
            return {
                data: {
                    batteryThreshold: value,
                },
            };
        case 8:
            return {
                data: {
                    detectInterval: value,
                },
            };
        case 15:
            return {
                data: {
                    magDetectInterval: value2Bytes,
                },
            };

        default:
            return {
                errors: ['invalid parameter key.'],
            };
    }
}

