/**
 * Payload Decoder
 *
 * Copyright 2025 Milesight IoT
 *
 * @product UC100
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
        // MODBUS
        else if (channel_id === 0xff && channel_type === 0x19) {
            var modbus_chn_id = bytes[i++] + 1;
            var data_length = bytes[i++];
            var data_type = bytes[i++];
            var sign = (data_type >>> 7) & 0x01;
            var type = data_type & 0x7f; // 0b01111111
            var modbus_chn_name = "modbus_chn_" + modbus_chn_id;
            switch (type) {
                case 0:
                    decoded[modbus_chn_name] = bytes[i];
                    i += 1;
                    break;
                case 1:
                    decoded[modbus_chn_name] = bytes[i];
                    i += 1;
                    break;
                case 2:
                case 3:
                    decoded[modbus_chn_name] = sign ? readInt16LE(bytes.slice(i, i + 2)) : readUInt16LE(bytes.slice(i, i + 2));
                    i += 2;
                    break;
                case 4:
                case 6:
                case 8:
                case 9:
                case 10:
                case 11:
                    decoded[modbus_chn_name] = sign ? readInt32LE(bytes.slice(i, i + 4)) : readUInt32LE(bytes.slice(i, i + 4));
                    i += 4;
                    break;
                case 5:
                case 7:
                    decoded[modbus_chn_name] = readFloatLE(bytes.slice(i, i + 4));
                    i += 4;
                    break;
            }
        }
        // MODBUS READ ERROR
        else if (channel_id === 0xff && channel_type === 0x15) {
            var modbus_chn_id = bytes[i] + 1;
            var modbus_chn_name = "modbus_chn_" + modbus_chn_id + "_error";
            decoded[modbus_chn_name] = 1;
            i += 1;
        }
        // MODBUS ALARM (v1.7+)
        else if (channel_id === 0xff && channel_type === 0xee) {
            var chn_def = bytes[i++];
            var data_length = bytes[i++];
            var data_def = bytes[i++];

            var modbus_chn_id = (chn_def & 0x1f) + 1;
            var modbus_alarm = readModbusAlarmType(chn_def >>> 6);
            var sign = (data_def >>> 7) & 0x01;
            var data_type = data_def & 0x7f;

            var modbus_chn_name = "modbus_chn_" + modbus_chn_id;
            decoded[modbus_chn_name + "_alarm"] = modbus_alarm;
            switch (data_type) {
                case 0: // MB_REG_COIL
                case 1: // MB_REG_DISCRETE
                    decoded[modbus_chn_name] = bytes[i];
                    i += 1;
                    break;
                case 2: // MB_REG_INPUT_AB
                case 3: // MB_REG_INPUT_BA
                case 14: // MB_REG_HOLD_INT16_AB
                case 15: // MB_REG_HOLD_INT16_BA
                    decoded[modbus_chn_name] = sign ? readInt16LE(bytes.slice(i, i + 2)) : readUInt16LE(bytes.slice(i, i + 2));
                    i += 2;
                    break;
                case 4: // MB_REG_INPUT_INT32_ABCD
                case 5: // MB_REG_INPUT_INT32_BADC
                case 6: // MB_REG_INPUT_INT32_CDAB
                case 7: // MB_REG_INPUT_INT32_DCBA
                case 16: // MB_REG_HOLD_INT32_ABCD
                case 17: // MB_REG_HOLD_INT32_BADC
                case 18: // MB_REG_HOLD_INT32_CDAB
                case 19: // MB_REG_HOLD_INT32_DCBA
                case 8: // MB_REG_INPUT_INT32_AB
                case 9: // MB_REG_INPUT_INT32_CD
                case 20: // MB_REG_HOLD_INT32_AB
                case 21: // MB_REG_HOLD_INT32_CD
                    decoded[modbus_chn_name] = sign ? readInt32LE(bytes.slice(i, i + 4)) : readUInt32LE(bytes.slice(i, i + 4));
                    i += 4;
                    break;
                case 10: // MB_REG_INPUT_FLOAT_ABCD
                case 11: // MB_REG_INPUT_FLOAT_BADC
                case 12: // MB_REG_INPUT_FLOAT_CDAB
                case 13: // MB_REG_INPUT_FLOAT_DCBA
                case 22: // MB_REG_HOLD_FLOAT_ABCD
                case 23: // MB_REG_HOLD_FLOAT_BADC
                case 24: // MB_REG_HOLD_FLOAT_CDAB
                case 25: // MB_REG_HOLD_FLOAT_DCBA
                    decoded[modbus_chn_name] = readFloatLE(bytes.slice(i, i + 4));
                    i += 4;
                    break;
            }
        }
        // MODBUS HISTORY (v1.7+)
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var timestamp = readUInt32LE(bytes.slice(i, i + 4));
            var chn_id = bytes[i + 4] + 1;
            var data_def = bytes[i + 5];
            var sign = (data_def >>> 7) & 0x01;
            var data_type = (data_def >> 2) & 0x1f;
            var read_status = (data_def >>> 1) & 0x01;
            i += 6;

            var data = {};
            data.timestamp = timestamp;
            var modbus_chn_name = "modbus_chn_" + chn_id;
            // READ FAILED
            if (read_status === 0) {
                data[modbus_chn_name + "_alarm"] = "read error";
            } else {
                switch (data_type) {
                    case 0: // MB_REG_COIL
                    case 1: // MB_REG_DISCRETE
                        data[modbus_chn_name] = bytes[i];
                        i += 4;
                        break;
                    case 2: // MB_REG_INPUT_AB
                    case 3: // MB_REG_INPUT_BA
                    case 14: // MB_REG_HOLD_INT16_AB
                    case 15: // MB_REG_HOLD_INT16_BA
                    case 4: // MB_REG_INPUT_INT32_ABCD
                    case 5: // MB_REG_INPUT_INT32_BADC
                    case 6: // MB_REG_INPUT_INT32_CDAB
                    case 7: // MB_REG_INPUT_INT32_DCBA
                    case 16: // MB_REG_HOLD_INT32_ABCD
                    case 17: // MB_REG_HOLD_INT32_BADC
                    case 18: // MB_REG_HOLD_INT32_CDAB
                    case 19: // MB_REG_HOLD_INT32_DCBA
                    case 8: // MB_REG_INPUT_INT32_AB
                    case 9: // MB_REG_INPUT_INT32_CD
                    case 20: // MB_REG_HOLD_INT32_AB
                    case 21: // MB_REG_HOLD_INT32_CD
                        data[modbus_chn_name] = sign ? readInt32LE(bytes.slice(i, i + 4)) : readUInt32LE(bytes.slice(i, i + 4));
                        i += 4;
                        break;
                    case 10: // MB_REG_INPUT_FLOAT_ABCD
                    case 11: // MB_REG_INPUT_FLOAT_BADC
                    case 12: // MB_REG_INPUT_FLOAT_CDAB
                    case 13: // MB_REG_INPUT_FLOAT_DCBA
                    case 22: // MB_REG_HOLD_FLOAT_ABCD
                    case 23: // MB_REG_HOLD_FLOAT_BADC
                    case 24: // MB_REG_HOLD_FLOAT_CDAB
                    case 25: // MB_REG_HOLD_FLOAT_DCBA
                        data[modbus_chn_name] = readFloatLE(bytes.slice(i, i + 4));
                        i += 4;
                        break;
                }
            }

            decoded.history = decoded.history || [];
            decoded.history.push(data);
        }
        // CUSTOM MESSAGE HISTORY (v1.7+)
        else if (channel_id === 0x20 && channel_type === 0xcd) {
            var timestamp = readUInt32LE(bytes.slice(i, i + 4));
            var msg_length = bytes[i + 4];
            var msg = readAscii(bytes.slice(i + 5, i + 5 + msg_length));
            i += 5 + msg_length;

            var data = {};
            data.timestamp = timestamp;
            data.custom_message = msg;

            decoded.history = decoded.history || [];
            decoded.history.push(data);
        }
        // DOWNLINK RESPONSE
        else if (channel_id === 0xfe) {
            result = handle_downlink_response(channel_type, bytes, i);
            decoded = Object.assign(decoded, result.data);
            i = result.offset;
        }
        // CUSTOM MESSAGE
        else {
            decoded.custom_message = readAscii(bytes.slice(i - 2, bytes.length));
            i = bytes.length;
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

function readAscii(bytes) {
    var str = "";
    for (var i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return str;
}

function readModbusAlarmType(type) {
    switch (type) {
        case 0x00:
            return "Normal";
        case 0x01:
            return "Threshold Alarm";
        case 0x02:
            return "Threshold Release Alarm";
        case 0x03:
            return "Mutation Alarm";
        default:
            return "Unknown";
    }
}

function fromUtf8Bytes(bytes) {
    return decodeURIComponent(
        bytes
            .map(function (ch) {
                return "%" + (ch < 16 ? "0" : "") + ch.toString(16);
            })
            .join("")
    );
}

function handle_downlink_response(channel_type, bytes, offset) {
    var decoded = {};

    switch (channel_type) {
        case 0x03: // report interval
            decoded.report_interval = readUInt16LE(bytes.slice(offset, offset + 2));
            offset += 2;
            break;
        case 0xef: // modbus_config
            var action = bytes[offset];
            if (action === 0x00) {
                decoded.modbus_config = { action: 0, channel_id: bytes[offset + 1] };
                offset += 2;
            } else if (action === 0x01) {
                decoded.modbus_config = {
                    action: 1,
                    channel_id: bytes[offset + 1],
                    slave_id: bytes[offset + 2],
                    address: bytes[offset + 3],
                    type: bytes[offset + 4],
                    sign: (bytes[offset + 5] >>> 4) & 0x01,
                    quantity: bytes[offset + 5] & 0x0f,
                };
                offset += 6;
            } else if (action === 0x02) {
                var name_length = bytes[offset + 2];
                decoded.modbus_config = {
                    action: 2,
                    channel_id: bytes[offset + 1],
                    name: fromUtf8Bytes(bytes.slice(offset + 3, offset + 3 + name_length)),
                };
                offset += 3 + name_length;
            }
            break;
        default:
            throw new Error("unknown downlink response");
    }

    return { data: decoded, offset: offset };
}

if (!Object.assign) {
    Object.defineProperty(Object, "assign", {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function (target) {
            "use strict";
            if (target == null) {
                // TypeError if undefined or null
                throw new TypeError("Cannot convert first argument to object");
            }

            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource == null) {
                    // Skip over if undefined or null
                    continue;
                }
                nextSource = Object(nextSource);

                var keysArray = Object.keys(Object(nextSource));
                for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                    var nextKey = keysArray[nextIndex];
                    var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                    if (desc !== undefined && desc.enumerable) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
            return to;
        },
    });
}
