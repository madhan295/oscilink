import { createComponent } from '../utils/componentFactory';

// Run this by importing it temporarily in main.tsx
export function runFactoryTests() {
    console.group('=== Component Factory Tests ===');

    // Test 1: All 12 types create without error
    const types = [
        'ARDUINO_UNO', 'LED', 'RESISTOR', 'PUSH_BUTTON',
        'POTENTIOMETER', 'SERVO_MOTOR', 'LCD_16X2', 'BUZZER',
        'ULTRASONIC_SENSOR', 'TEMPERATURE_SENSOR', 'RELAY', 'BREADBOARD'
    ] as const;

    types.forEach(type => {
        try {
            const comp = createComponent(type, { x: 0, y: 0 });
            const pinCount = Object.keys(comp.pins).length;
            console.log(`✓ ${type}: ${pinCount} pins, ID starts with ${comp.id.slice(0, 8)}`);
        } catch (e: any) {
            console.error(`✗ ${type} FAILED:`, e.message);
        }
    });

    // Test 2: Arduino specific pins
    const arduino = createComponent('ARDUINO_UNO', { x: 0, y: 0 });
    console.log('--- Arduino Pin Check ---');
    console.log('Has D13:', 'D13' in arduino.pins ? '✓' : '✗ MISSING');
    console.log('Has GND_1:', 'GND_1' in arduino.pins ? '✓' : '✗ MISSING');
    console.log('Has A0:', 'A0' in arduino.pins ? '✓' : '✗ MISSING');
    console.log('Total pins:', Object.keys(arduino.pins).length, '(should be 20+)');

    // Test 3: LED pins
    const led = createComponent('LED', { x: 0, y: 0 });
    console.log('--- LED Pin Check ---');
    console.log('Has ANODE:', 'ANODE' in led.pins ? '✓' : '✗ MISSING');
    console.log('Has CATHODE:', 'CATHODE' in led.pins ? '✓' : '✗ MISSING');
    console.log('Pin count is 2:', Object.keys(led.pins).length === 2 ? '✓' : '✗');
    console.log('Default color RED:', led.properties.color === 'RED' ? '✓' : '✗');

    // Test 4: Resistor
    const resistor = createComponent('RESISTOR', { x: 0, y: 0 });
    console.log('--- Resistor Check ---');
    console.log('Resistance 220:', resistor.properties.resistance === 220 ? '✓' : '✗');

    // Test 5: Unique IDs
    const led1 = createComponent('LED', { x: 0, y: 0 });
    const led2 = createComponent('LED', { x: 0, y: 0 });
    console.log('--- Unique ID Check ---');
    console.log('IDs are unique:', led1.id !== led2.id ? '✓' : '✗ IDs ARE THE SAME - BUG');

    // Test 6: Invalid type
    console.log('--- Invalid Type Check ---');
    try {
        createComponent('INVALID' as any, { x: 0, y: 0 });
        console.error('✗ Should have thrown an error for invalid type');
    } catch (e) {
        console.log('✓ Correctly throws error for invalid type');
    }

    console.log('=== Tests Complete ===');
    console.groupEnd();
}