import { motion } from 'framer-motion';
import { Lock, Shield, Key, FileDigit } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ElementData {
  id: string;
  type: string;
  text?: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startScale: number;
  targetScale: number;
  size: number;
  duration: number;
  delay: number;
}

export const AnimatedBackground = () => {
  const [elements, setElements] = useState<ElementData[]>([]);

  useEffect(() => {
    const newElements: ElementData[] = [];
    
    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    // Generar iconos
    for (let i = 0; i < 20; i++) {
      const types = ['shield', 'lock', 'key', 'file'];
      newElements.push({
        id: `icon-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        startX: random(0, 100),
        startY: random(0, 100),
        // Movimiento suave y aleatorio hacia otra parte de la pantalla
        targetX: random(0, 100),
        targetY: random(0, 100),
        // Efecto de profundidad (de atrás hacia adelante)
        startScale: random(0.2, 0.6),
        targetScale: random(1.2, 2.2),
        size: random(20, 35),
        duration: random(15, 35), // Duración más lenta para más fluidez
        delay: random(0, 5)
      });
    }

    // Generar códigos
    for (let i = 0; i < 20; i++) {
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
        targetX: random(0, 100),
        targetY: random(0, 100),
        startScale: random(0.3, 0.8),
        targetScale: random(1.5, 2.5),
        size: random(12, 22),
        duration: random(18, 40),
        delay: random(0, 5)
      });
    }
    
    const timeout = setTimeout(() => {
      setElements(newElements);
    }, 0);
    return () => clearTimeout(timeout);
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
                x: [`${el.startX}vw`, `${el.targetX}vw`],
                y: [`${el.startY}vh`, `${el.targetY}vh`],
                scale: [el.startScale, el.targetScale],
                opacity: [0, 0.5, 0]
              }}
              transition={{ 
                duration: el.duration, 
                delay: el.delay,
                repeat: Infinity, 
                repeatType: "mirror",
                ease: "easeInOut" 
              }}
              style={{ position: 'absolute', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace', fontSize: el.size, fontWeight: 'bold', textShadow: '0 0 10px rgba(255,255,255,0.4)' }}
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
                x: [`${el.startX}vw`, `${el.targetX}vw`],
                y: [`${el.startY}vh`, `${el.targetY}vh`],
                scale: [el.startScale, el.targetScale],
                opacity: [0, 0.4, 0], 
                rotate: [0, 180] 
              }}
              transition={{ 
                duration: el.duration, 
                delay: el.delay,
                repeat: Infinity, 
                repeatType: "mirror",
                ease: "easeInOut" 
              }}
              style={{ position: 'absolute', color: '#ffffff', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' }}
            >
              <IconComponent size={el.size} />
            </motion.div>
          );
        }
      })}
    </div>
  );
};
