/***********************************************************************************************************
 * CNDINGTEK Waste Bin Level Sensor DF703 Codec for Chirpstack/TTN(The Things Network).
 * Version 1.0  Date 2022-12-3
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
            //bytes: [0x80, 0x00, 0x01, 0x02, 0x19, 0x07, 0xD0, 0x01, 0xCD, 0x03, 0xE9, 0x42, 0xEF, 0x27, 0x20, 0x42, 0x19, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x81],
            //bytes: [0x80,0x00,0x01,0x01,0x11,0x07,0xD0,0x00,0x19,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x81],
            bytes: [0x80,0x00,0x01,0x03,0x19,0x01,0x04,0x18,0x01,0x1E,0x4B,0x1E,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x81],
            variables: {}
        };
        var ret = decodeUplink(Input);
        break;
    case 2:
        Input = {
            fPort: 3,
            bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x31, 0x38, 0x31],
            variables: {}
        };
        var ret = decodeDownlink(Input);
        break;
    case 3:
        downlink = {
            data: {
                uploadInterval: 4
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
        case 17:
            return {
                // Decoded data
                data: {
                    level: (input.bytes[5] << 8) + input.bytes[6],
                    alarmLevel: Boolean(input.bytes[11] >> 4),
                    alarmFire: Boolean(input.bytes[11] & 0x0f),
                    alarmFall: Boolean(input.bytes[12] >> 4),
                    alarmBattery: Boolean(input.bytes[12] & 0x0f),
                    angle: (input.bytes[9] & (0x0f === 0x00) ? input.bytes[10] : 0 - input.bytes[10]),
                    temperature: input.bytes[8],
                    frameCounter: (input.bytes[13] << 8) + input.bytes[14],
                },
            };

        case 25:
            var data_type = input.bytes[3];
            if (data_type === 0x03) {
                return {
                    // Decoded parameter
                    data: {
                        firmware: input.bytes[5] + "." + input.bytes[6],
                        uploadInterval: input.bytes[7],
                        detectInterval: input.bytes[8],                        
                        levelThreshold: input.bytes[9],
                        fireThreshold: input.bytes[10],
                        fallThreshold: input.bytes[11],
                        fallEnable: Boolean(input.bytes[12]),
                        workMode:input.bytes[14],
                    },
                };
            } else {
                return {
                    // Decoded data
                    data: {
                        level: (input.bytes[5] << 8) + input.bytes[6],
                        longitude: hex2float((input.bytes[11] << 24) + (input.bytes[10] << 16) + (input.bytes[9] << 8) + input.bytes[8]).toFixed(6),
                        latitude: hex2float((input.bytes[15] << 24) + (input.bytes[14] << 16) + (input.bytes[13] << 8) + input.bytes[12]).toFixed(6),
                        alarmLevel: Boolean(input.bytes[19] >> 4),
                        alarmFire: Boolean(input.bytes[19] & 0x0f),
                        alarmFall: Boolean(input.bytes[20] >> 4),
                        alarmBattery: Boolean(input.bytes[20] & 0x0f),
                        angle: (input.bytes[17] & (0x0f === 0x00) ? input.bytes[18] : 0 - input.bytes[18]),
                        temperature: input.bytes[16],
                        frameCounter: (input.bytes[21] << 8) + input.bytes[22],
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
        var uploadInterval = input.data.uploadInterval;        
        var uploadInterval_high = uploadInterval.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var uploadInterval_low = uploadInterval.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (uploadInterval > 168 || uploadInterval < 1) {
            return {
                errors: ['periodic upload interval range 1-168 hours.'],
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
        var detection_interval = input.data.detectInterval;
        var detection_interval_high = detection_interval.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var detection_interval_low = detection_interval.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (detection_interval > 60 || detection_interval < 1) {
            return {
                errors: ['cyclic detection interval range 1-60 minutes.'],
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
        var full_alarm_threshold = input.data.levelThreshold;
        var full_alarm_threshold_high = full_alarm_threshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var full_alarm_threshold_low = full_alarm_threshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (full_alarm_threshold > 255 || full_alarm_threshold < 15) {
            return {
                errors: ['full alarm threshold range 15-255 cm.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x32, full_alarm_threshold_high, full_alarm_threshold_low, 0x38, 0x31],
            };
        }
    }
    if (input.data.fireThreshold != null && !isNaN(input.data.fireThreshold)) {
        var fireThreshold = input.data.fireThreshold;
        var fireThreshold_high = fireThreshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var fireThreshold_low = fireThreshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (fireThreshold > 255 || fireThreshold < 1) {
            return {
                errors: ['fire alarm threshold range 1-255 cellus degree.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x33, fireThreshold_high, fireThreshold_low, 0x38, 0x31],
            };
        }
    }

    if (input.data.fallThreshold != null && !isNaN(input.data.fallThreshold)) {
        var tilt_alarm_threshold = input.data.fallThreshold;
        var tilt_alarm_threshold_high = tilt_alarm_threshold.toString(16).padStart(2, '0').toUpperCase()[0].charCodeAt(0);
        var tilt_alarm_threshold_low = tilt_alarm_threshold.toString(16).padStart(2, '0').toUpperCase()[1].charCodeAt(0);
        if (tilt_alarm_threshold > 90 || tilt_alarm_threshold < 15) {
            return {
                errors: ['fall alarm threshold range 15-90 °.'],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x34, tilt_alarm_threshold_high, tilt_alarm_threshold_low, 0x38, 0x31],
            };
        }
    }
    
    if (input.data.fallEnable != null && input.data.fallEnable === !!input.data.fallEnable) {
        var tilt_enable = input.data.fallEnable;
        if (tilt_enable === true) {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x41, 0x38, 0x31],
            };
        } else {
            return {
                // LoRaWAN FPort used for the downlink message
                fPort: 3,
                // Encoded bytes
                bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x39, 0x38, 0x31],
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
                    levelThreshold: value,
                },
            };
        case 3:
            return {
                data: {
                    fireThreshold: value,
                },
            };
        case 4:
            return {
                data: {
                    fallThreshold: value,
                },
            };
        case 9:
            switch (value) {
                case 0x00:
                    return {
                        data: {
                            gpsEnable: false,
                        },
                    };
                case 0x01:
                    return {
                        data: {
                            gpsEnable: true,
                        },
                    };
                case 0x03:
                    return {
                        data: {
                            activeMode: ABP,
                        },
                    };
                case 0x04:
                    return {
                        data: {
                            activeMode: OTAA,
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
                case 0x09:
                    return {
                        data: {
                            fallEnable: false,
                        },
                    };
                case 0x0a:
                    return {
                        data: {
                            fallEnable: true,
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


