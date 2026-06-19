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
        </Group>
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
        const onMouseDownIdx = content.indexOf('onMouseDown=', renderPinsStart);
        if (onMouseDownIdx !== -1) {
          const groupEndBracketIdx = content.indexOf('>', onMouseDownIdx);
          if (groupEndBracketIdx !== -1) {
            // Find the NEXT </Group> after groupEndBracketIdx. But wait, the tooltip also has a <Group> and </Group>!
            // Actually, wait, the ORIGINAL code has <Group> and </Group> inside?
            // Actually, we can just replace everything from `groupEndBracketIdx + 1` to the last `</Group>` before `);`
            // Let's just find `        </Group>\n      );\n    });`
            
            const returnGroupEndIdx = content.indexOf('</Group>\n      );\n    });', groupEndBracketIdx);
            
            if (returnGroupEndIdx !== -1) {
               // Great!
               const newContent = content.substring(0, groupEndBracketIdx + 1) + targetCode + content.substring(returnGroupEndIdx + 8);
               fs.writeFileSync(fullPath, newContent);
               console.log('Updated', file);
            } else {
               console.log('Could not find end for', file);
            }
          }
        }
      }
    }
  });
});
