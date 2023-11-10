/**
 * Payload Decoder for Milesight Network Server
 *
 * Copyright 2023 Milesight IoT
 *
 * @product TS301
 */
function Decode(fPort, bytes) {
    return milesight(bytes);
}

function milesight(bytes) {
    var decoded = {};

    for (var i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];

        // BATTERY
        if (channel_id === 0x01 && channel_type === 0x75) {
            decoded.battery = bytes[i];
            i += 1;
        }
        // TEMPERATURE (CHANNEL 1)
        else if (channel_id === 0x03 && channel_type === 0x67) {
            decoded.temperature_chn1 = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // MAGNET STATUS (CHANNEL 1)
        else if (channel_id === 0x03 && channel_type === 0x00) {
            decoded.magnet_chn1 = bytes[i];
            i += 1;
        }
        // TEMPERATURE (CHANNEL 2)
        else if (channel_id === 0x04 && channel_type === 0x67) {
            decoded.temperature_chn2 = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // MAGNET STATUS (CHANNEL 2)
        else if (channel_id === 0x04 && channel_type === 0x00) {
            decoded.magnet_chn2 = bytes[i];
            i += 1;
        }
        // TEMPERATURE ALARM (CHANNEL 1)
        else if (channel_id === 0x83 && channel_type === 0x67) {
            decoded.temperature_chn1 = readInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.temperature_alarm_chn1 = bytes[i + 2];
            i += 3;
        }
        // TEMPERATURE ALARM (CHANNEL 2)
        else if (channel_id === 0x84 && channel_type === 0x67) {
            decoded.temperature_chn2 = readInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.temperature_alarm_chn2 = bytes[i + 2];
            i += 3;
        }
        // TEMPERATURE ALARM (CHANNEL 1)
        else if (channel_id === 0x93 && channel_type === 0xd7) {
            decoded.temperature_chn1 = readInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.temperature_change_chn1 = readInt16LE(bytes.slice(i + 2, i + 4)) / 100;
            decoded.temperature_alarm_chn1 = bytes[i + 4];
            i += 5;
        }
        // TEMPERATURE ALARM (CHANNEL 2)
        else if (channel_id === 0x94 && channel_type === 0xd7) {
            decoded.temperature_chn2 = readInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.temperature_change_chn2 = readInt16LE(bytes.slice(i + 2, i + 4)) / 100;
            decoded.temperature_alarm_chn2 = bytes[i + 4];
            i += 5;
        }
        // HISTORY
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var timestamp = readUInt32LE(bytes.slice(i, i + 4));
            var mask = bytes[i + 4];
            i += 5;

            var data = { timestamp: timestamp };
            var chn1_event = mask >>> 4;
            var chn2_event = mask & 0x0f;
            switch (chn1_event) {
                case 0x01:
                case 0x02:
                case 0x03:
                case 0x04:
                    data.temperature_chn1 = readInt16LE(bytes.slice(i, i + 2)) / 10;
                    data.report_event_chn1 = chn1_event;
                    break;
                case 0x05:
                case 0x06:
                    data.magnet_chn1 = readInt16LE(bytes.slice(i, i + 2));
                    data.report_event_chn1 = chn1_event;
                    break;
                default:
                    break;
            }
            i += 2;

            switch (chn2_event) {
                case 0x01:
                case 0x02:
                case 0x03:
                case 0x04:
                    data.temperature_chn2 = readInt16LE(bytes.slice(i, i + 2)) / 10;
                    data.report_event_chn2 = chn2_event;
                    break;
                case 0x05:
                case 0x06:
                    data.magnet_chn2 = readInt16LE(bytes.slice(i, i + 2));
                    data.report_event_chn2 = chn2_event;
                    break;
                default:
                    break;
            }
            i += 2;

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

function readAlarmType(type) {
    switch (type) {
        case 0:
            return "threshold release";
        case 1:
            return "threshold";
        case 2:
            return "mutation";
        default:
            return "unkown";
    }
}
