import { motion } from 'framer-motion';
import { Lock, Shield, Key, FileDigit } from 'lucide-react';
import { useEffect, useState } from 'react';

export const AnimatedBackground = () => {
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    const newElements = [];
    
    // Función auxiliar para obtener un valor aleatorio entre min y max
    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    // Generar iconos
    for (let i = 0; i < 25; i++) {
      const types = ['shield', 'lock', 'key', 'file'];
      newElements.push({
        id: `icon-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        startX: random(0, 100),
        startY: random(0, 100),
        targetX1: random(-20, 120),
        targetY1: random(-20, 120),
        targetX2: random(-20, 120),
        targetY2: random(-20, 120),
        startScale: random(0.3, 0.8),
        targetScale: random(1.5, 2.5),
        size: random(20, 40),
        duration: random(25, 45)
      });
    }

    // Generar códigos
    for (let i = 0; i < 30; i++) {
      const isBinary = Math.random() > 0.5;
      const text = isBinary 
        ? Array.from({length: 8}, () => Math.random() > 0.5 ? '1' : '0').join('')
        : '0x' + Array.from({length: 6}, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
        
      newElements.push({
        id: `code-${i}`,
        type: 'code',
        text,
        startX: random(0, 100),
        startY: random(0, 100),
        targetX1: random(-20, 120),
        targetY1: random(-20, 120),
        targetX2: random(-20, 120),
        targetY2: random(-20, 120),
        startScale: random(0.5, 1),
        targetScale: random(1.5, 2.5),
        size: random(12, 24),
        duration: random(20, 40)
      });
    }
    
    setElements(newElements);
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {elements.map((el) => {
        if (el.type === 'code') {
          return (
            <motion.div
              key={el.id}
              initial={{ 
                x: `${el.startX}vw`, 
                y: `${el.startY}vh`, 
                scale: el.startScale,
                opacity: 0
              }}
              animate={{ 
                x: [`${el.startX}vw`, `${el.targetX1}vw`, `${el.targetX2}vw`, `${el.startX}vw`],
                y: [`${el.startY}vh`, `${el.targetY1}vh`, `${el.targetY2}vh`, `${el.startY}vh`],
                scale: [el.startScale, el.targetScale, el.startScale * 0.5, el.startScale],
                opacity: [0, 0.4, 0.1, 0]
              }}
              transition={{ duration: el.duration, repeat: Infinity, ease: "linear" }}
              style={{ position: 'absolute', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace', fontSize: el.size, fontWeight: 'bold', textShadow: '0 0 5px rgba(255,255,255,0.8)' }}
            >
              {el.text}
            </motion.div>
          );
        } else {
          let IconComponent = Lock;
          if (el.type === 'shield') IconComponent = Shield;
          if (el.type === 'key') IconComponent = Key;
          if (el.type === 'file') IconComponent = FileDigit;

          return (
            <motion.div
              key={el.id}
              initial={{ 
                x: `${el.startX}vw`, 
                y: `${el.startY}vh`, 
                scale: el.startScale,
                opacity: 0,
                rotate: 0 
              }}
              animate={{ 
                x: [`${el.startX}vw`, `${el.targetX1}vw`, `${el.targetX2}vw`, `${el.startX}vw`],
                y: [`${el.startY}vh`, `${el.targetY1}vh`, `${el.targetY2}vh`, `${el.startY}vh`],
                scale: [el.startScale, el.targetScale, el.startScale * 0.5, el.startScale],
                opacity: [0, 0.25, 0.1, 0], 
                rotate: [0, 180, 360, 0] 
              }}
              transition={{ duration: el.duration, repeat: Infinity, ease: "linear" }}
              style={{ position: 'absolute', color: '#ffffff', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.8))' }}
            >
              <IconComponent size={el.size} />
            </motion.div>
          );
        }
      })}
    </div>
  );
};
