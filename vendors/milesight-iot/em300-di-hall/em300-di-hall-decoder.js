/**
 * Payload Decoder
 *
 * Copyright 2025 Milesight IoT
 *
 * @product EM300-DI (HALL)
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
        // GPIO
        else if (channel_id === 0x05 && channel_type === 0x00) {
            decoded.gpio = bytes[i];
            decoded.gpio_type = 0;
            i += 1;
        }
        // WATER
        else if (channel_id === 0x05 && channel_type === 0xe1) {
            decoded.water_conv = readUInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.pulse_conv = readUInt16LE(bytes.slice(i + 2, i + 4)) / 10;
            decoded.water = readFloatLE(bytes.slice(i + 4, i + 8));
            decoded.gpio_type = 1;
            i += 8;
        }
        // GPIO ALARM
        else if (channel_id === 0x85 && channel_type === 0x00) {
            decoded.gpio = bytes[i];
            decoded.gpio_alarm = bytes[i + 1];
            i += 2;
        }
        // WATER ALARM
        else if (channel_id === 0x85 && channel_type === 0xe1) {
            decoded.water_conv = readUInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.pulse_conv = readUInt16LE(bytes.slice(i + 2, i + 4)) / 10;
            decoded.water = readFloatLE(bytes.slice(i + 4, i + 8));
            decoded.water_alarm = bytes[i + 8];
            i += 9;
        }
        // HISTORY
        else if (channel_id === 0x21 && channel_type === 0xce) {
            var data = {};
            data.timestamp = readUInt32LE(bytes.slice(i, i + 4));
            // IGNORE: byte 4,5,6
            data.alarm = bytes[i + 7];
            var mode = bytes[i + 8];
            if (mode === 1) {
                data.gpio_type = mode;
                data.gpio = bytes[i + 9];
            } else if (mode === 2) {
                data.gpio_type = mode;
                data.water_conv = readUInt16LE(bytes.slice(i + 10, i + 12)) / 10;
                data.pulse_conv = readUInt16LE(bytes.slice(i + 12, i + 14)) / 10;
                data.water = readFloatLE(bytes.slice(i + 14, i + 18));
            }
            i += 18;

            decoded.history = decoded.history || [];
            decoded.history.push(data);
        } else {
            break;
        }
    }

    return decoded;
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

function readFloatLE(bytes) {
    // JavaScript bitwise operators yield a 32 bits integer, not a float.
    // Assume LSB (least significant byte first).
    var bits = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
    var sign = bits >>> 31 === 0 ? 1.0 : -1.0;
    var e = (bits >>> 23) & 0xff;
    var m = e === 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
    var f = sign * m * Math.pow(2, e - 150);

    var v = Number(f.toFixed(2));
    return v;
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

function readGPIOStatus(bytes) {
    // 0: low, 1: high
    switch (bytes) {
        case 0:
            return "low";
        case 1:
            return "high";
        default:
            return "unknown";
    }
}

function readGPIOAlarm(bytes) {
    // 1: gpio alarm, 0: gpio alarm release
    switch (bytes) {
        case 0:
            return "gpio alarm release";
        case 1:
            return "gpio alarm";
        default:
            return "unknown";
    }
}

function readWaterAlarm(bytes) {
    // 1: water outage timeout alarm, 2: water outage timeout alarm release, 3: water flow timeout alarm, 4: water flow timeout alarm release
    switch (bytes) {
        case 1:
            return "water outage timeout alarm";
        case 2:
            return "water outage timeout alarm release";
        case 3:
            return "water flow timeout alarm";
        case 4:
            return "water flow timeout alarm release";
        default:
            return "unknown";
    }
}

function readAlarm(bytes) {
    // 0: none, 1: water outage timeout alarm, 2: water outage timeout alarm release, 3: water flow timeout alarm, 4: water flow timeout alarm release, 5: gpio alarm, 6: gpio alarm release
    switch (bytes) {
        case 0:
            return "none";
        case 1:
            return "water outage timeout alarm";
        case 2:
            return "water outage timeout alarm release";
        case 3:
            return "water flow timeout alarm";
        case 4:
            return "water flow timeout alarm release";
        case 5:
            return "gpio alarm";
        case 6:
            return "gpio alarm release";
        default:
            return "unknown";
    }
}
