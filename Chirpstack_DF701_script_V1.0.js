/***********************************************************************************************************
 * CNDINGTEK Waste Bin Level Sensor DF701 Codec for Chirpstack/TTN(The Things Network).
 * Version 1.0  Date 2022-12-3
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
            //bytes: [0x80, 0x00, 0x01, 0x02, 0x12, 0x27, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x68, 0x00, 0x01, 0x81],
            bytes: [0x80, 0x00, 0x01, 0x03, 0x0C, 0x00, 0x00, 0x0A, 0x0A, 0x14, 0x00, 0x81],
            //bytes: [0x38,0x30,0x30,0x32,0x39,0x39,0x39,0x39,0x30,0x31,0x30,0x31,0x38,0x31],
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
                workMode: 0
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
        case 18:
            return {
                // Decoded data
                data: {
                    level: (input.bytes[5] << 8) + input.bytes[6],
                    alarmLevel: Boolean(input.bytes[11] >> 4),                    
                    alarmBattery: Boolean(input.bytes[12] & 0x0f),
                    volt: ((input.bytes[13] << 8) + input.bytes[14]) / 100,
                    frameCounter: (input.bytes[15] << 8) + input.bytes[16],
                },
            };

        case 12:
            var data_type = input.bytes[3];
            if (data_type === 0x03) {
                return {
                    // Decoded parameter
                    data: {
                        firmware: input.bytes[5] + "." + input.bytes[6],
                        uploadInterval: input.bytes[7],
                        detectInterval: input.bytes[8],
                        levelThreshold: input.bytes[9],
                        workMode: input.bytes[10],
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
    if (input.data.periodic_upload_interval != null && !isNaN(input.data.periodic_upload_interval)) {
        var periodic_interval = input.data.periodic_upload_interval;
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
    if (input.data.periodic_detection_interval != null && !isNaN(input.data.periodic_detection_interval)) {
        var detection_interval = input.data.periodic_detection_interval;
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
    if (input.data.full_alarm_threshold != null && !isNaN(input.data.full_alarm_threshold)) {
        var full_alarm_threshold = input.data.full_alarm_threshold;
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
    if (input.data.workMode != null) {
        var workMode = input.data.workMode;
        switch (workMode) {
            case 0:
                return {
                    // LoRaWAN FPort used for the downlink message
                    fPort: 3,
                    // Encoded bytes
                    bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x30, 0x38, 0x31],
                };
                break;
            case 1:
                return {
                    // LoRaWAN FPort used for the downlink message
                    fPort: 3,
                    // Encoded bytes
                    bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x31, 0x38, 0x31],
                };
                break;
            case 2:
                return {
                    // LoRaWAN FPort used for the downlink message
                    fPort: 3,
                    // Encoded bytes
                    bytes: [0x38, 0x30, 0x30, 0x32, 0x39, 0x39, 0x39, 0x39, 0x30, 0x39, 0x30, 0x45, 0x38, 0x31],
                };
                break;
            default:
                break;

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
        case 5:
            return {
                data: {
                    batteryThreshold: value,
                },
            };
        case 9:
            switch (value) {
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

