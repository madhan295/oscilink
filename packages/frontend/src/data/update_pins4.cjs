const fs = require('fs');
const path = require('path');

const targetCode = `
          <Circle x={0} y={0} radius={6} fill="transparent" />
          <Circle
            x={0} y={0}
            radius={isHovered ? 2.5 : 1.5}
            fill={isHovered ? '#fbbf24' : '#171717'}
            stroke={isHovered ? '#fbbf24' : '#404040'}
            strokeWidth={isHovered ? 1 : 0.5}
          />
          {isHovered && (
            <Group x={-12} y={8}>
              <Rect width={24} height={10} fill="#1f2937" cornerRadius={2} opacity={0.9} />
              <Text
                text={pin.label}
                width={24} height={10}
                align="center" verticalAlign="middle"
                fontSize={6} fill="#fbbf24"
                fontFamily="monospace" fontStyle="bold"
              />
            </Group>
          )}
`;

const dirs = [
  'd:/Coding Files/Arduino Simulator/packages/frontend/src/components/circuit-components/active',
  'd:/Coding Files/Arduino Simulator/packages/frontend/src/components/circuit-components/passive'
];

dirs.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.tsx') && file !== 'UltrasonicSensor.tsx' && file !== 'TemperatureSensor.tsx') {
      const fullPath = path.join(dir, file);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const renderPinsStart = content.indexOf('const renderPins =');
      if (renderPinsStart !== -1) {
        // Let's use regex to find `<Group key={pin.id}` and replace everything inside it.
        // Or simply find `<Circle x={0} y={0} radius={8} fill="transparent" />` and replace until `</Group>`
        // For LCD16x2 it is radius={6}. 
        // For Relay it is radius={8}.
        
        // Find onMouseDown=
        const onMouseDownIdx = content.indexOf('onMouseDown=', renderPinsStart);
        if (onMouseDownIdx !== -1) {
          // Find the closing > of the Group tag by looking for the next character after `=> ... )}`
          // Actually, let's just find the first `<Circle` after `onMouseDown=`
          const circleStartIdx = content.indexOf('<Circle', onMouseDownIdx);
          if (circleStartIdx !== -1) {
             // Now find the NEXT `);` after circleStartIdx. But we only want to replace up to the LAST `</Group>` before `);`
             const returnGroupRegex = /<\/Group>\s*\);\s*}\);/m;
             const renderPinsContent = content.substring(circleStartIdx);
             const match = returnGroupRegex.exec(renderPinsContent);
             
             if (match) {
                 const newContent = content.substring(0, circleStartIdx) + targetCode.trim() + '\n      );\n    });';
                 
                 // Wait! What if there is code after `</Group>` but before `);`?
                 // Let's just find the `</Group>` right before `);`
                 const endIdx = circleStartIdx + match.index;
                 fs.writeFileSync(fullPath, content.substring(0, circleStartIdx) + targetCode.trim() + '\n      ' + renderPinsContent.substring(match.index));
                 console.log('Updated', file);
             } else {
                 console.log('Could not find returnGroup in', file);
             }
          }
        }
      }
    }
  });
});
