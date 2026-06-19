const fs = require('fs');
const path = require('path');

const targetCode = `<Circle x={0} y={0} radius={6} fill="transparent" />
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
        </Group>`;

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
      
      if (content.includes('const renderPins = () => {')) {
        // Find the renderPins function
        // We will look for `onMouseDown={(e) => onPinMouseDown(e, pin.id)}` or similar ending of the Group props,
        // and replace everything between `>` and `</Group>` with our new targetCode.
        
        let startIdx = content.indexOf('onMouseDown=');
        if (startIdx !== -1) {
            // we have to find it inside renderPins.
            const renderPinsIdx = content.indexOf('const renderPins =');
            startIdx = content.indexOf('onMouseDown=', renderPinsIdx);
            
            if (startIdx !== -1) {
                // Find the closing bracket of the Group tag
                const groupCloseIdx = content.indexOf('>', startIdx) + 1;
                
                // Find the matching </Group> for this pin mapping
                // Let's use regex to replace everything inside the Group that is returned in map()
                
                const regex = /(<Group[^>]*onMouseDown=[^>]*>)([\s\S]*?)(<\/Group>)/;
                const match = regex.exec(content.substring(renderPinsIdx));
                if (match) {
                    const originalGroupBlock = match[0];
                    const newGroupBlock = match[1] + '\n          ' + targetCode;
                    
                    // Since it might be multiple, actually in the map it's just one Group block.
                    content = content.substring(0, renderPinsIdx) + content.substring(renderPinsIdx).replace(regex, newGroupBlock);
                    
                    fs.writeFileSync(fullPath, content);
                    console.log('Updated', file);
                }
            }
        }
      }
    }
  });
});
