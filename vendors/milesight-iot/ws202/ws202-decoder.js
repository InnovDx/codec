/**
 * Payload Decoder for Milesight Network Server
 *
 * Copyright 2023 Milesight IoT
 *
 * @product WS202
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
        // PIR
        else if (channel_id === 0x03 && channel_type === 0x00) {
            decoded.pir_trigger = bytes[i];
            i += 1;
        }
        // LIGHT STATUS
        else if (channel_id === 0x04 && channel_type === 0x00) {
            decoded.light_status = bytes[i];
            i += 1;
        } else {
            break;
        }
    }

    return decoded;
}
