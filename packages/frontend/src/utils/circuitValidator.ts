import { v4 as uuidv4 } from 'uuid';
import { CircuitComponent, Wire } from '../types/components';
import { CircuitGraph } from '../simulation/engine/CircuitGraph';
import { CircuitError } from '../types/simulation';

export function detectShortCircuit(_components: CircuitComponent[], _wires: Wire[], graph: CircuitGraph): CircuitError[] {
  const errors: CircuitError[] = [];
  const powerNodes = Array.from(graph.nodes.values()).filter(n => n.pinType === 'power');
  
  const globalVisited = new Set<string>();
  
  for (const pNode of powerNodes) {
    if (globalVisited.has(pNode.id)) continue;

    // Custom BFS to find path to ground and sum resistance
    const visited = new Set<string>();
    const queue: { id: string; path: string[]; resistance: number }[] = [{ 
      id: pNode.id, 
      path: [pNode.id], 
      resistance: 0 
    }];
    visited.add(pNode.id);
    globalVisited.add(pNode.id);

    let foundShort = false;

    while (queue.length > 0 && !foundShort) {
      const current = queue.shift()!;
      const node = graph.nodes.get(current.id);
      
      if (!node) continue;

      if (node.pinType === 'ground' && current.resistance < 10) {
        // Short circuit detected!
        const affectedCompIds = Array.from(new Set(current.path.map(id => id.split('.')[0])));
        errors.push({
          id: uuidv4(),
          type: 'SHORT_CIRCUIT',
          severity: 'error',
          message: `Short circuit detected between Power and Ground. Total resistance is ${current.resistance}Ω (minimum 10Ω required).`,
          affectedComponentIds: affectedCompIds,
          hint: 'Add a resistor to limit the current, or check for crossed wires.'
        });
        foundShort = true;
        break;
      }

      // Add resistance of current component if it's a resistor
      let newResistance = current.resistance;
      const comp = graph.components.get(node.componentId);
      if (comp && comp.type === 'RESISTOR') {
        newResistance += (comp.properties?.resistance || 0);
      }

      // Add other pins of the SAME component (internal paths), except complex ones
      if (comp && comp.pins && !['ARDUINO_UNO', 'PUSH_BUTTON', 'SWITCH', 'LED', 'ULTRASONIC_SENSOR', 'RELAY', 'LCD_16X2_I2C', 'LCD_16X2', 'BREADBOARD'].includes(comp.type)) {
        for (const pin of comp.pins) {
          if (pin.id !== node.pinId) {
            const internalNeighborId = `${comp.id}.${pin.id}`;
            if (!visited.has(internalNeighborId)) {
              visited.add(internalNeighborId);
              globalVisited.add(internalNeighborId);
              queue.push({ 
                id: internalNeighborId, 
                path: [...current.path, internalNeighborId], 
                resistance: newResistance 
              });
            }
          }
        }
      }

      // Traverse connected wires
      const neighbors = graph.adjacency.get(current.id);
      if (neighbors) {
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            globalVisited.add(neighborId);
            queue.push({ 
              id: neighborId, 
              path: [...current.path, neighborId], 
              resistance: newResistance 
            });
          }
        }
      }
    }
  }

  return errors;
}

export function detectLEDWithoutResistor(components: CircuitComponent[], _wires: Wire[], graph: CircuitGraph): CircuitError[] {
  const errors: CircuitError[] = [];
  const leds = components.filter(c => c.type === 'LED');

  for (const led of leds) {
    const resAnode = graph.findSeriesResistance(`${led.id}.ANODE`);
    const resCathode = graph.findSeriesResistance(`${led.id}.CATHODE`);
    
    if (resAnode === 0 && resCathode === 0) {
      const connected = graph.getConnectedComponents(led.id, 'ANODE').concat(graph.getConnectedComponents(led.id, 'CATHODE'));
      const affectedCompIds = Array.from(new Set([led.id, ...connected.map(c => c.id)]));
      
      errors.push({
        id: uuidv4(),
        type: 'MISSING_RESISTOR',
        severity: 'warning',
        message: 'LED is connected without a current-limiting resistor.',
        affectedComponentIds: affectedCompIds,
        hint: 'Add a 220Ω or 330Ω resistor in series with the LED to prevent it from burning out.'
      });
    }
  }

  return errors;
}

export function detectMissingGround(components: CircuitComponent[], _wires: Wire[], _graph: CircuitGraph): CircuitError[] {
  const errors: CircuitError[] = [];
  
  components.forEach(comp => {
    if (comp.type === 'ARDUINO_UNO' || comp.type === 'RESISTOR') return;
    
    Object.values(comp.pins).forEach(pin => {
      if (pin.type === 'ground' || pin.id === 'CATHODE' || pin.id === 'GND' || pin.id === '-') {
        if (pin.connectedWireIds.length === 0) {
          errors.push({
            id: uuidv4(),
            type: 'MISSING_GROUND',
            severity: 'warning',
            message: `${comp.type} component is missing a ground connection.`,
            affectedComponentIds: [comp.id],
            hint: `Connect the ${pin.label || pin.id} pin to a GND pin on the Arduino.`
          });
        }
      }
    });
  });

  return errors;
}

export function detectUnconnectedPowerPin(components: CircuitComponent[], _wires: Wire[], _graph: CircuitGraph): CircuitError[] {
  const errors: CircuitError[] = [];
  
  components.forEach(comp => {
    if (comp.type === 'ARDUINO_UNO') return;
    
    Object.values(comp.pins).forEach(pin => {
      if (pin.type === 'power' || pin.id === 'VCC' || pin.id === '+' || pin.id === '5V') {
        if (pin.connectedWireIds.length === 0) {
          errors.push({
            id: uuidv4(),
            type: 'UNCONNECTED_POWER',
            severity: 'info',
            message: `${comp.type} component might need power.`,
            affectedComponentIds: [comp.id],
            hint: `Connect the ${pin.label || pin.id} pin to 5V or 3.3V on the Arduino.`
          });
        }
      }
    });
  });

  return errors;
}

export function detectReversedPolarity(components: CircuitComponent[], _wires: Wire[], graph: CircuitGraph): CircuitError[] {
  const errors: CircuitError[] = [];
  const leds = components.filter(c => c.type === 'LED');

  for (const led of leds) {
    const anodeToGround = graph.hasPathToGround(`${led.id}.ANODE`);
    const cathodeToPower = graph.hasPathToPower(`${led.id}.CATHODE`);
    
    if (anodeToGround) {
      errors.push({
        id: uuidv4(),
        type: 'REVERSED_POLARITY',
        severity: 'warning',
        message: 'LED polarity appears to be reversed (Anode connected to Ground).',
        affectedComponentIds: [led.id],
        hint: 'The longer leg (Anode) must connect to positive voltage, and the shorter leg (Cathode) to ground.'
      });
    } else if (cathodeToPower) {
      errors.push({
        id: uuidv4(),
        type: 'REVERSED_POLARITY',
        severity: 'warning',
        message: 'LED polarity appears to be reversed (Cathode connected to Power).',
        affectedComponentIds: [led.id],
        hint: 'The shorter leg (Cathode) must connect to ground.'
      });
    }
  }

  return errors;
}

export function detectOvercurrent(components: CircuitComponent[], _wires: Wire[], graph: CircuitGraph): CircuitError[] {
  const errors: CircuitError[] = [];
  const leds = components.filter(c => c.type === 'LED');

  for (const led of leds) {
    const resAnode = graph.findSeriesResistance(`${led.id}.ANODE`);
    const resCathode = graph.findSeriesResistance(`${led.id}.CATHODE`);
    const totalResistance = resAnode + resCathode;
    
    if (totalResistance > 0) {
      const forwardVoltage = Number(led.properties?.forwardVoltage || 2.0);
      // Assume worst-case 5V supply
      const expectedCurrent = ((5.0 - forwardVoltage) / totalResistance) * 1000;
      
      if (expectedCurrent > 100) {
        errors.push({
          id: uuidv4(),
          type: 'OVERCURRENT',
          severity: 'error',
          message: `Severe overcurrent detected on LED! Expected current is ${expectedCurrent.toFixed(1)}mA (max 30mA).`,
          affectedComponentIds: [led.id],
          hint: 'Increase the resistance of your series resistor.'
        });
      } else if (expectedCurrent > 30) {
        errors.push({
          id: uuidv4(),
          type: 'OVERCURRENT',
          severity: 'warning',
          message: `Overcurrent warning on LED. Expected current is ${expectedCurrent.toFixed(1)}mA (recommended <20mA).`,
          affectedComponentIds: [led.id],
          hint: 'Increase the resistance of your series resistor to extend LED lifespan.'
        });
      }
    }
  }

  return errors;
}

export function detectFloatingAnalogInput(components: CircuitComponent[], _wires: Wire[], graph: CircuitGraph): CircuitError[] {
  const errors: CircuitError[] = [];
  const arduino = components.find(c => c.type === 'ARDUINO_UNO');
  
  if (arduino) {
    const analogPins = Object.values(arduino.pins).filter(p => p.id.startsWith('A') && p.id.length === 2);
    
    for (const pin of analogPins) {
      if (pin.connectedWireIds.length > 0) {
        const connectedComps = graph.getConnectedComponents(arduino.id, pin.id);
        const hasDefinedSource = connectedComps.some(c => 
          c.type === 'POTENTIOMETER' || 
          c.type === 'ULTRASONIC_SENSOR' ||
          c.type === 'LCD_16X2_I2C' ||
          c.type === 'LCD_16X2'
        );
        
        if (!hasDefinedSource) {
          errors.push({
            id: uuidv4(),
            type: 'FLOATING_ANALOG_INPUT',
            severity: 'info',
            message: `Analog pin ${pin.id} is connected, but may be floating without a definitive voltage source.`,
            affectedComponentIds: [arduino.id, ...connectedComps.map(c => c.id)],
            hint: 'Ensure your analog input is driven by a sensor or voltage divider.'
          });
        }
      }
    }
  }

  return errors;
}

export function validateCircuit(components: CircuitComponent[], wires: Wire[], graph: CircuitGraph): CircuitError[] {
  let allErrors: CircuitError[] = [];
  const rules = [
    detectShortCircuit,
    detectLEDWithoutResistor,
    detectMissingGround,
    detectUnconnectedPowerPin,
    detectReversedPolarity,
    detectOvercurrent,
    detectFloatingAnalogInput
  ];

  for (const rule of rules) {
    try {
      const errors = rule(components, wires, graph);
      allErrors = allErrors.concat(errors);
    } catch (e) {
      console.error(`Error executing circuit validation rule ${rule.name}:`, e);
    }
  }

  return allErrors;
}
