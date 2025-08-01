/**
 * Payload Decoder
 *
 * Copyright 2025 Milesight IoT
 *
 * @product WTS305 / WTS505 / WTS506
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
            decoded.battery = readUInt8(bytes[i]);
            i += 1;
        }
        // TEMPERATURE
        else if (channel_id === 0x03 && channel_type === 0x67) {
            // ℃
            decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // HUMIDITY
        else if (channel_id === 0x04 && channel_type === 0x68) {
            decoded.humidity = bytes[i] / 2;
            i += 1;
        }
        // WIND DIRECTION
        else if (channel_id === 0x05 && channel_type === 0x84) {
            decoded.wind_direction = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // BAROMETRIC PRESSURE
        else if (channel_id === 0x06 && channel_type === 0x73) {
            decoded.pressure = readUInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // WIND SPEED
        else if (channel_id === 0x07 && channel_type === 0x92) {
            decoded.wind_speed = readUInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // RAINFALL TOTAL
        else if (channel_id === 0x08 && channel_type === 0x77) {
            decoded.rainfall_total = readUInt16LE(bytes.slice(i, i + 2)) / 100;
            decoded.rainfall_counter = readUInt8(bytes[i + 2]);
            i += 3;
        }
        // RAINFALL TOTAL (v3)
        else if (channel_id === 0x08 && channel_type === 0xec) {
            decoded.rainfall_total = readUInt32LE(bytes.slice(i, i + 4)) / 100;
            decoded.rainfall_counter = readUInt8(bytes[i + 4]);
            i += 5;
        }
        // TEMPERATURE ALARM
        else if (channel_id === 0x83 && channel_type === 0x67) {
            decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.temperature_alarm = bytes[i + 2];
            i += 3;
        }
        // BAROMETRIC PRESSURE ALARM
        else if (channel_id === 0x86 && channel_type === 0x73) {
            decoded.pressure = readUInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.pressure_alarm = bytes[i + 2];
            i += 3;
        }
        // WIND SPEED ALARM
        else if (channel_id === 0x87 && channel_type === 0x92) {
            decoded.wind_speed = readUInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.wind_speed_alarm = bytes[i + 2];
            i += 3;
        }
        // RAINFALL ALARM
        else if (channel_id === 0x88 && channel_type === 0xec) {
            decoded.rainfall_total = readUInt32LE(bytes.slice(i, i + 4)) / 100;
            decoded.rainfall_counter = bytes[i + 4];
            decoded.rainfall_alarm = bytes[i + 5];
            i += 6;
        }
        // HISTORY (v1)
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var data = {};
            data.timestamp = readUInt32LE(bytes.slice(i, i + 4));
            data.temperature = readInt16LE(bytes.slice(i + 4, i + 6)) / 10;
            data.humidity = bytes[i + 6] / 2;
            data.pressure = readUInt16LE(bytes.slice(i + 7, i + 9)) / 10;
            data.wind_direction = readInt16LE(bytes.slice(i + 9, i + 11)) / 10;
            data.wind_speed = readUInt16LE(bytes.slice(i + 11, i + 13)) / 10;
            data.rainfall_total = readUInt16LE(bytes.slice(i + 13, i + 15)) / 100;
            i += 15;

            decoded.history = decoded.history || [];
            decoded.history.push(data);
        }
        // HISTORY (v2)
        else if (channel_id === 0x21 && channel_type === 0xce) {
            var data = {};
            data.timestamp = readUInt32LE(bytes.slice(i, i + 4));
            data.temperature = readInt16LE(bytes.slice(i + 4, i + 6)) / 10;
            data.humidity = bytes[i + 6] / 2;
            data.pressure = readUInt16LE(bytes.slice(i + 7, i + 9)) / 10;
            data.wind_direction = readInt16LE(bytes.slice(i + 9, i + 11)) / 10;
            data.wind_speed = readUInt16LE(bytes.slice(i + 11, i + 13)) / 10;
            data.rainfall_total = readUInt32LE(bytes.slice(i + 13, i + 17)) / 100;
            i += 17;

            decoded.history = decoded.history || [];
            decoded.history.push(data);
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

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return ref > 0x7fffffff ? ref - 0x100000000 : ref;
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

function readAlarmType(type) {
    switch (type) {
        case 0:
            return "threshold alarm release";
        case 1:
            return "threshold alarm";
        default:
            return "unknown";
    }
}
