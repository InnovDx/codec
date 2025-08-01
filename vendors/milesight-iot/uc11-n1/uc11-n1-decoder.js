/**
 * Payload Decoder
 *
 * Copyright 2025 Milesight IoT
 *
 * @product UC11-N1
 */
function Decode(fPort, bytes) {
    return milesight(bytes);
}

function milesight(bytes) {
    var decoded = {};

    for (i = 0; i < bytes.length; ) {
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
        // GPIO 1
        else if (channel_id === 0x03 && channel_type !== 0xc8) {
            decoded.gpio_1 = bytes[i];
            i += 1;
        }
        // GPIO2
        else if (channel_id === 0x04 && channel_type !== 0xc8) {
            decoded.gpio_2 = bytes[i];
            i += 1;
        }
        // PULSE COUNTER
        else if (channel_id === 0x04 && channel_type === 0xc8) {
            decoded.gpio_counter = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // ADC 1
        else if (channel_id === 0x05) {
            decoded.adc_1 = readInt16LE(bytes.slice(i, i + 2)) / 100;
            decoded.adc_1_min = readInt16LE(bytes.slice(i + 2, i + 4)) / 100;
            decoded.adc_1_max = readInt16LE(bytes.slice(i + 4, i + 6)) / 100;
            decoded.adc_1_avg = readInt16LE(bytes.slice(i + 6, i + 8)) / 100;
            i += 8;
            continue;
        }
        // ADC 2
        else if (channel_id === 0x06) {
            decoded.adc_2 = readInt16LE(bytes.slice(i, i + 2)) / 100;
            decoded.adc_2_min = readInt16LE(bytes.slice(i + 2, i + 4)) / 100;
            decoded.adc_2_max = readInt16LE(bytes.slice(i + 4, i + 6)) / 100;
            decoded.adc_2_avg = readInt16LE(bytes.slice(i + 6, i + 8)) / 100;
            i += 8;
            continue;
        }
        // MODBUS
        else if (channel_id === 0xff && channel_type === 0x0e) {
            var modbus_chn_id = bytes[i++] - 6;
            var package_type = bytes[i++];
            var data_type = package_type & 7;
            var date_length = package_type >> 3;
            var chn = "modbus_chn_" + modbus_chn_id;
            switch (data_type) {
                case 0:
                    decoded[chn] = bytes[i];
                    i += 1;
                    break;
                case 1:
                    decoded[chn] = bytes[i];
                    i += 1;
                    break;
                case 2:
                case 3:
                    decoded[chn] = readUInt16LE(bytes.slice(i, i + 2));
                    i += 2;
                    break;
                case 4:
                case 6:
                    decoded[chn] = readUInt32LE(bytes.slice(i, i + 4));
                    i += 4;
                    break;
                case 5:
                case 7:
                    decoded[chn] = readFloatLE(bytes.slice(i, i + 4));
                    i += 4;
                    break;
            }
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

function readFloatLE(bytes) {
    // JavaScript bitwise operators yield a 32 bits integer, not a float.
    // Assume LSB (least significant byte first).
    var bits = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
    var sign = bits >>> 31 === 0 ? 1.0 : -1.0;
    var e = (bits >>> 23) & 0xff;
    var m = e === 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
    var f = sign * m * Math.pow(2, e - 150);
    return f;
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
