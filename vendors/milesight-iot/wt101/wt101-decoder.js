/**
 * Payload Decoder
 *
 * Copyright 2025 Milesight IoT
 *
 * @product WT101
 */
var RAW_VALUE = 0x01;

// Chirpstack v4
function decodeUplink(input) {
    var decoded = milesightDeviceDecode(input.bytes);
    return { data: decoded };
}

// Chirpstack v3
function Decode(fPort, bytes) {
    return milesightDeviceDecode(bytes);
}

// The Things Network
function Decoder(bytes, port) {
    return milesightDeviceDecode(bytes);
}

function milesightDeviceDecode(bytes) {
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
            decoded.device_status = readDeviceStatus(1);
            i += 1;
        }
        // LORAWAN CLASS
        else if (channel_id === 0xff && channel_type === 0x0f) {
            decoded.lorawan_class = readLoRaWANClass(bytes[i]);
            i += 1;
        }
        // PRODUCT SERIAL NUMBER
        else if (channel_id === 0xff && channel_type === 0x16) {
            decoded.sn = readSerialNumber(bytes.slice(i, i + 8));
            i += 8;
        }
        // TSL VERSION
        else if (channel_id === 0xff && channel_type === 0xff) {
            decoded.tsl_version = readTslVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // BATTERY
        else if (channel_id === 0x01 && channel_type === 0x75) {
            decoded.battery = readUInt8(bytes[i]);
            i += 1;
        }
        // TEMPERATURE
        else if (channel_id === 0x03 && channel_type === 0x67) {
            decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // TARGET TEMPERATURE
        else if (channel_id === 0x04 && channel_type === 0x67) {
            decoded.target_temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // VALVE OPENING
        else if (channel_id === 0x05 && channel_type === 0x92) {
            decoded.valve_opening = readUInt8(bytes[i]);
            i += 1;
        }
        // TAMPER STATUS
        else if (channel_id === 0x06 && channel_type === 0x00) {
            decoded.tamper_status = readTamperStatus(bytes[i]);
            i += 1;
        }
        // WINDOW DETECTION
        else if (channel_id === 0x07 && channel_type === 0x00) {
            decoded.window_detection = readWindowDetectionStatus(bytes[i]);
            i += 1;
        }
        // MOTOR STROKE CALIBRATION RESULT
        else if (channel_id === 0x08 && channel_type === 0xe5) {
            decoded.motor_calibration_result = readMotorCalibrationResult(bytes[i]);
            i += 1;
        }
        // MOTOR STROKE
        else if (channel_id === 0x09 && channel_type === 0x90) {
            decoded.motor_stroke = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // FREEZE PROTECTION
        else if (channel_id === 0x0a && channel_type === 0x00) {
            decoded.freeze_protection = readFreezeProtectionStatus(bytes[i]);
            i += 1;
        }
        // MOTOR CURRENT POSITION
        else if (channel_id === 0x0b && channel_type === 0x90) {
            decoded.motor_position = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // HEATING DATE
        else if (channel_id === 0xf9 && channel_type === 0x33) {
            decoded.heating_date = readHeatingDate(bytes.slice(i, i + 7));
            i += 7;
        }
        // HEATING SCHEDULE
        else if (channel_id === 0xf9 && channel_type === 0x34) {
            var heating_schedule = readHeatingSchedule(bytes.slice(i, i + 9));
            decoded.heating_schedule = decoded.heating_schedule || [];
            decoded.heating_schedule.push(heating_schedule);
            i += 9;
        }
        // DOWNLINK RESPONSE
        else if (channel_id === 0xfe) {
            result = handle_downlink_response(channel_type, bytes, i);
            decoded = Object.assign(decoded, result.data);
            i = result.offset;
        }
        // DOWNLINK RESPONSE
        else if (channel_id === 0xf8) {
            result = handle_downlink_response_ext(channel_type, bytes, i);
            decoded = Object.assign(decoded, result.data);
            i = result.offset;
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

function readDeviceStatus(type) {
    var device_status_map = {
        0: "off",
        1: "on",
    };
    return getValue(device_status_map, type);
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

function readTslVersion(bytes) {
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

function readLoRaWANClass(type) {
    var lorawan_class_map = {
        0: "Class A",
        1: "Class B",
        2: "Class C",
        3: "Class CtoB",
    };
    return getValue(lorawan_class_map, type);
}

function readTamperStatus(type) {
    var tamper_status_map = {
        0: "installed",
        1: "uninstalled",
    };
    return getValue(tamper_status_map, type);
}

function readWindowDetectionStatus(type) {
    var window_detection_status_map = {
        0: "normal",
        1: "open",
    };
    return getValue(window_detection_status_map, type);
}

function readMotorCalibrationResult(type) {
    var motor_calibration_result_map = {
        0: "success",
        1: "fail: out of range",
        2: "fail: uninstalled",
        3: "calibration cleared",
        4: "temperature control disabled",
    };
    return getValue(motor_calibration_result_map, type);
}

function readFreezeProtectionStatus(type) {
    var freeze_protection_status_map = {
        0: "normal",
        1: "triggered",
    };
    return getValue(freeze_protection_status_map, type);
}

function readHeatingDate(bytes) {
    var heating_date = {};
    var offset = 0;
    heating_date.enable = readEnableStatus(bytes[offset]);
    heating_date.report_interval = readUInt16LE(bytes.slice(offset + 1, offset + 3));
    heating_date.start_month = readMonth(bytes[offset + 3]);
    heating_date.start_day = readUInt8(bytes[offset + 4]);
    heating_date.end_month = readMonth(bytes[offset + 5]);
    heating_date.end_day = readUInt8(bytes[offset + 6]);
    return heating_date;
}

function readHeatingSchedule(bytes) {
    var heating_schedule = {};
    var offset = 0;
    heating_schedule.index = readUInt8(bytes[offset]) + 1;
    heating_schedule.enable = readEnableStatus(bytes[offset + 1]);
    heating_schedule.temperature_control_mode = readTemperatureControlMode(bytes[offset + 2]);
    heating_schedule.value = readUInt8(bytes[offset + 3]);
    heating_schedule.report_interval = readUInt16LE(bytes.slice(offset + 4, offset + 6));
    heating_schedule.execute_time = readUInt16LE(bytes.slice(offset + 6, offset + 8));
    var day = readUInt8(bytes[offset + 8]);
    heating_schedule.week_recycle = {};
    var week_day_offset = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
    for (var key in week_day_offset) {
        heating_schedule.week_recycle[key] = readEnableStatus((day >>> week_day_offset[key]) & 0x01);
    }

    return heating_schedule;
}

function handle_downlink_response(channel_type, bytes, offset) {
    var decoded = {};

    switch (channel_type) {
        case 0x4a: // sync_time
            decoded.sync_time = readSyncTime(bytes[offset]);
            offset += 1;
            break;
        case 0x8e: // report_interval
            // ignore the first byte
            decoded.report_interval = readUInt16LE(bytes.slice(offset + 1, offset + 3));
            offset += 3;
            break;
        case 0x3b: // time_sync_enable
            decoded.time_sync_enable = readEnableStatus(bytes[offset]);
            offset += 1;
            break;
        case 0xb3: // temperature_control(enable)
            decoded.temperature_control = decoded.temperature_control || {};
            decoded.temperature_control.enable = readEnableStatus(bytes[offset]);
            offset += 1;
            break;
        case 0xae: // temperature_control(mode)
            decoded.temperature_control = decoded.temperature_control || {};
            decoded.temperature_control.mode = readTemperatureControlMode(bytes[offset]);
            offset += 1;
            break;
        case 0xab: // temperature_calibration(enable, temperature)
            decoded.temperature_calibration = {};
            decoded.temperature_calibration.enable = readEnableStatus(bytes[offset]);
            decoded.temperature_calibration.temperature = readInt16LE(bytes.slice(offset + 1, offset + 3)) / 10;
            offset += 3;
            break;
        case 0xb1: // target_temperature, temperature_tolerance
            decoded.target_temperature = readInt8(bytes[offset]);
            decoded.temperature_tolerance = readUInt16LE(bytes.slice(offset + 1, offset + 3)) / 10;
            offset += 3;
            break;
        case 0xac: // valve_control_algorithm
            decoded.valve_control_algorithm = readValveControlAlgorithm(bytes[offset]);
            offset += 1;
            break;
        case 0xb0: // freeze_protection_config(enable, temperature)
            decoded.freeze_protection_config = decoded.freeze_protection_config || {};
            decoded.freeze_protection_config.enable = readEnableStatus(bytes[offset]);
            decoded.freeze_protection_config.temperature = readInt16LE(bytes.slice(offset + 1, offset + 3)) / 10;
            offset += 3;
            break;
        case 0xaf: // open_window_detection(enable, rate, time)
            decoded.open_window_detection = decoded.open_window_detection || {};
            decoded.open_window_detection.enable = readEnableStatus(bytes[offset]);
            decoded.open_window_detection.temperature_threshold = readInt8(bytes[offset + 1]) / 10;
            decoded.open_window_detection.time = readUInt16LE(bytes.slice(offset + 2, offset + 4));
            offset += 4;
            break;
        case 0x57: // restore_open_window_detection
            decoded.restore_open_window_detection = readYesNo(bytes[offset]);
            offset += 1;
            break;
        case 0xb4: // valve_opening
            decoded.valve_opening = readUInt8(bytes[offset]);
            offset += 1;
            break;
        case 0xad: // valve_calibration
            decoded.valve_calibration = readYesNo(bytes[offset]);
            offset += 1;
            break;
        case 0x25: // child_lock_config
            decoded.child_lock_config = decoded.child_lock_config || {};
            decoded.child_lock_config.enable = readEnableStatus(bytes[offset]);
            offset += 1;
            break;
        case 0xc4: // outside_temperature_control
            decoded.outside_temperature_control = {};
            decoded.outside_temperature_control.enable = readEnableStatus(bytes[offset]);
            decoded.outside_temperature_control.timeout = readUInt8(bytes[offset + 1]);
            offset += 2;
            break;
        case 0xf8: // offline_control_mode
            decoded.offline_control_mode = readOfflineControlMode(bytes[offset]);
            offset += 1;
            break;
        case 0xbd:
            decoded.timezone = readTimeZone(readInt16LE(bytes.slice(offset, offset + 2)));
            offset += 2;
            break;
        case 0xba: // dst_config
            decoded.dst_config = {};
            decoded.dst_config.enable = readEnableStatus(bytes[offset]);
            decoded.dst_config.offset = readInt8(bytes[offset + 1]);
            decoded.dst_config.start_month = readMonth(bytes[offset + 2]);
            decoded.dst_config.start_week_num = readUInt8(bytes[offset + 3]) >> 4;
            decoded.dst_config.start_week_day = readWeek(bytes[offset + 3] & 0x0f);
            decoded.dst_config.start_time = readUInt16LE(bytes.slice(offset + 4, offset + 6));
            decoded.dst_config.end_month = readMonth(bytes[offset + 6]);
            decoded.dst_config.end_week_num = readUInt8(bytes[offset + 7]) >> 4;
            decoded.dst_config.end_week_day = readWeek(bytes[offset + 7] & 0x0f);
            decoded.dst_config.end_time = readUInt16LE(bytes.slice(offset + 8, offset + 10));
            offset += 10;
            break;
        default:
            throw new Error("unknown downlink response");
    }

    return { data: decoded, offset: offset };
}

function handle_downlink_response_ext(channel_type, bytes, offset) {
    var decoded = {};

    switch (channel_type) {
        case 0x33:
            var heating_date_result = readUInt8(bytes[offset + 7]);
            if (heating_date_result === 0) {
                decoded.heating_date = readHeatingDate(bytes.slice(offset, offset + 7));
            }
            offset += 8;
            break;
        case 0x34:
            var heating_schedule_result = readUInt8(bytes[offset + 9]);
            if (heating_schedule_result === 0) {
                var heating_schedule = readHeatingSchedule(bytes.slice(offset, offset + 9));
                decoded.heating_schedule = decoded.heating_schedule || [];
                decoded.heating_schedule.push(heating_schedule);
            }
            offset += 10;
            break;
        case 0x35:
            var target_temperature_range_result = readUInt8(bytes[offset + 2]);
            if (target_temperature_range_result === 0) {
                decoded.target_temperature_range = {};
                decoded.target_temperature_range.min = readInt8(bytes[offset]);
                decoded.target_temperature_range.max = readInt8(bytes[offset + 1]);
            }
            offset += 3;
            break;
        case 0x36:
            var display_ambient_temperature_result = readUInt8(bytes[offset + 1]);
            if (display_ambient_temperature_result === 0) {
                decoded.display_ambient_temperature = readEnableStatus(bytes[offset]);
            }
            offset += 2;
            break;
        case 0x37:
            var window_detection_valve_strategy_result = readUInt8(bytes[offset + 1]);
            if (window_detection_valve_strategy_result === 0) {
                decoded.window_detection_valve_strategy = readWindowDetectionValveStrategy(bytes[offset]);
            }
            offset += 2;
            break;
        case 0x38: // effective_stroke
            var effective_stroke_result = readUInt8(bytes[offset + 2]);
            if (effective_stroke_result === 0) {
                decoded.effective_stroke = {};
                decoded.effective_stroke.enable = readEnableStatus(bytes[offset]);
                decoded.effective_stroke.rate = readUInt8(bytes[offset + 1]);
            }
            offset += 3;
            break;
        case 0x3a: // change_report_enable
            var change_report_enable_result = readUInt8(bytes[offset + 1]);
            if (change_report_enable_result === 0) {
                decoded.change_report_enable = readEnableStatus(bytes[offset]);
            }
            offset += 2;
            break;
        default:
            throw new Error("unknown downlink response");
    }

    return { data: decoded, offset: offset };
}

function readYesNo(type) {
    var yes_no_map = { 0: "no", 1: "yes" };
    return getValue(yes_no_map, type);
}

function readEnableStatus(type) {
    var enable_status_map = { 0: "disable", 1: "enable" };
    return getValue(enable_status_map, type);
}

function readWeek(type) {
    var week_map = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday" };
    return getValue(week_map, type);
}

function readMonth(type) {
    var month_map = { 1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June", 7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December" };
    return getValue(month_map, type);
}

function readTemperatureControlMode(type) {
    var temperature_control_mode_map = { 0: "auto", 1: "manual" };
    return getValue(temperature_control_mode_map, type);
}

function readTimeZone(type) {
    var timezone_map = { "-720": "UTC-12", "-660": "UTC-11", "-600": "UTC-10", "-570": "UTC-9:30", "-540": "UTC-9", "-480": "UTC-8", "-420": "UTC-7", "-360": "UTC-6", "-300": "UTC-5", "-240": "UTC-4", "-210": "UTC-3:30", "-180": "UTC-3", "-120": "UTC-2", "-60": "UTC-1", 0: "UTC", 60: "UTC+1", 120: "UTC+2", 180: "UTC+3", 210: "UTC+3:30", 240: "UTC+4", 270: "UTC+4:30", 300: "UTC+5", 330: "UTC+5:30", 345: "UTC+5:45", 360: "UTC+6", 390: "UTC+6:30", 420: "UTC+7", 480: "UTC+8", 540: "UTC+9", 570: "UTC+9:30", 600: "UTC+10", 630: "UTC+10:30", 660: "UTC+11", 720: "UTC+12", 765: "UTC+12:45", 780: "UTC+13", 840: "UTC+14" };
    return getValue(timezone_map, type);
}

function readSyncTime(type) {
    var sync_time_map = { 0: "no", 1: "yes" };
    return getValue(sync_time_map, type);
}

function readValveControlAlgorithm(type) {
    var valve_control_algorithm_map = { 0: "rate", 1: "pid" };
    return getValue(valve_control_algorithm_map, type);
}

function readOfflineControlMode(type) {
    var offline_control_mode_map = { 0: "keep", 1: "embedded temperature control", 2: "off" };
    return getValue(offline_control_mode_map, type);
}

function readWindowDetectionValveStrategy(type) {
    var window_detection_valve_strategy_map = { 0: "keep", 1: "close" };
    return getValue(window_detection_valve_strategy_map, type);
}

function getValue(map, key) {
    if (RAW_VALUE) return key;

    var value = map[key];
    if (!value) value = "unknown";
    return value;
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
