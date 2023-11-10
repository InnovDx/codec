/**
 * Payload Decoder for Milesight Network Server
 *
 * Copyright 2023 Milesight IoT
 *
 * @product UC51x v3
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
        // VALVE 1
        else if (channel_id === 0x03 && channel_type == 0x01) {
            decoded.valve_1 = bytes[i];
            i += 1;
        }
        // VALVE 2
        else if (channel_id === 0x05 && channel_type == 0x01) {
            decoded.valve_2 = bytes[i];
            i += 1;
        }
        // VALVE 1 PULSE
        else if (channel_id === 0x04 && channel_type === 0xc8) {
            decoded.valve_1_pulse = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // VALVE 2 PULSE
        else if (channel_id === 0x06 && channel_type === 0xc8) {
            decoded.valve_2_pulse = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // GPIO 1
        else if (channel_id === 0x07 && channel_type == 0x01) {
            decoded.gpio_1 = bytes[i];
            i += 1;
        }
        // GPIO 2
        else if (channel_id === 0x08 && channel_type == 0x01) {
            decoded.gpio_2 = bytes[i];
            i += 1;
        }
        // HISTORY
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var timestamp = readUInt32LE(bytes.slice(i, i + 4));
            var data = bytes[i + 4];
            var status = data & 0x01;
            var mode = (data >> 1) & 0x01;
            var gpio = (data >> 2) & 0x01;
            var index = ((data >> 4) & 0x01) === 0 ? "1" : "2";
            var pulse = readUInt32LE(bytes.slice(i + 5, i + 9));

            var data = { timestamp: timestamp, mode: mode };
            if (mode == 1) {
                var valve_chn_name = "valve_" + index;
                var gpio_chn_name = "gpio_" + index;
                data[valve_chn_name] = status;
                data[gpio_chn_name] = gpio;
            } else if (mode == 0) {
                var valve_chn_name = "valve_" + index;
                data[valve_chn_name] = status;
                data[valve_chn_name + "_pulse"] = pulse;
            }
            i += 9;

            decoded.history = decoded.history | [];
            decoded.history.push(data);
        } else {
            break;
        }
    }

    return decoded;
}

/* ******************************************
 * bytes to number
 ********************************************/
function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return ref > 0x7fffffff ? ref - 0x100000000 : ref;
}
