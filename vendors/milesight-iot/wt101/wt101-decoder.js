/**
 * Payload Decoder for Milesight Network Server
 *
 * Copyright 2023 Milesight IoT
 *
 * @product WT101
 */
function Decode(fPort, bytes) {
    return milesight(bytes);
}

function milesight(bytes) {
    var decoded = {};

    for (var i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];

        // IPSO VERSION
        if (channel_id === 0xff && channel_type === 0x01) {
            decoded.ipso_version = readProtocolVersion(bytes[i]);
            i += 1;
        }
        // HARDWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x09) {
            decoded.hardware_version = readHardwareVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // FIRMWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x0a) {
            decoded.firmware_version = readFirmwareVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // DEVICE STATUS
        else if (channel_id === 0xff && channel_type === 0x0b) {
            decoded.device_status = 1;
            i += 1;
        }
        // LORAWAN CLASS TYPE
        else if (channel_id === 0xff && channel_type === 0x0f) {
            decoded.lorawan_class = bytes[i];
            i += 1;
        }
        // SERIAL NUMBER
        else if (channel_id === 0xff && channel_type === 0x16) {
            decoded.sn = readSerialNumber(bytes.slice(i, i + 8));
            i += 8;
        }
        // BATTERY
        else if (channel_id === 0x01 && channel_type === 0x75) {
            decoded.battery = bytes[i];
            i += 1;
        }
        // TEMPERATURE
        else if (channel_id === 0x03 && channel_type === 0x67) {
            decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // TEMPERATURE TARGET
        else if (channel_id === 0x04 && channel_type === 0x67) {
            decoded.temperature_target = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // VALVE OPENING
        else if (channel_id === 0x05 && channel_type === 0x92) {
            decoded.valve_opening = readUInt8(bytes[i]);
            i += 1;
        }
        // TAMPER STATUS
        else if (channel_id === 0x06 && channel_type === 0x00) {
            decoded.tamper_status = bytes[i];
            i += 1;
        }
        // WINDOW DETECTION
        else if (channel_id === 0x07 && channel_type === 0x00) {
            decoded.window_detection = bytes[i];
            i += 1;
        }
        // MOTOR STORKE CALIBRATION RESULT
        else if (channel_id === 0x08 && channel_type === 0xe5) {
            decoded.motor_calibration_result = bytes[i];
            i += 1;
        }
        // MOTOR STROKE
        else if (channel_id === 0x09 && channel_type === 0x90) {
            decoded.motor_storke = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // FREEZE PROTECTION
        else if (channel_id === 0x0a && channel_type === 0x00) {
            decoded.freeze_protection = bytes[i];
            i += 1;
        }
        // MOTOR CURRENT POSTION
        else if (channel_id === 0x0b && channel_type === 0x90) {
            decoded.motor_position = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        } else {
            break;
        }
    }

    return decoded;
}

function readUInt8(bytes) {
    return bytes & 0xff;
}

function readInt8(bytes) {
    var ref = readUInt8(bytes);
    return ref > 0x7f ? ref - 0x100 : ref;
}

function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readProtocolVersion(bytes) {
    var major = (bytes & 0xf0) >> 4;
    var minor = bytes & 0x0f;
    return "v" + major + "." + minor;
}

function readHardwareVersion(bytes) {
    var major = bytes[0] & 0xff;
    var minor = (bytes[1] & 0xff) >> 4;
    return "v" + major + "." + minor;
}

function readFirmwareVersion(bytes) {
    var major = bytes[0] & 0xff;
    var minor = bytes[1] & 0xff;
    return "v" + major + "." + minor;
}

function readSerialNumber(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push(("0" + (bytes[idx] & 0xff).toString(16)).slice(-2));
    }
    return temp.join("");
}
function readMotorCalibration(type) {
    switch (type) {
        case 0x00:
            return "success";
        case 0x01:
            return "fail: out of range";
        case 0x02:
            return "fail: uninstalled";
        case 0x03:
            return "calibration cleared";
        case 0x04:
            return "temperature control disabled";
        default:
            return "unknown";
    }
}
