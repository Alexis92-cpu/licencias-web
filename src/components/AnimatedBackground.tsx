import { motion } from 'framer-motion';
import { Lock, Shield, Key, FileDigit } from 'lucide-react';
import { useEffect, useState } from 'react';

export const AnimatedBackground = () => {
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    const newElements = [];
    // Generar iconos de seguridad flotantes (candados, escudos, llaves)
    for (let i = 0; i < 20; i++) {
      const types = ['shield', 'lock', 'key', 'file'];
      const type = types[Math.floor(Math.random() * types.length)];
      newElements.push({
        id: `icon-${i}`,
        type,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 30 + 20, // entre 20 y 50px
        duration: Math.random() * 25 + 20,
        delay: Math.random() * 10
      });
    }

    // Generar cadenas de códigos binarios y hexadecimales cayendo/subiendo
    for (let i = 0; i < 30; i++) {
      const isBinary = Math.random() > 0.5;
      const text = isBinary 
        ? Array.from({length: 8}, () => Math.random() > 0.5 ? '1' : '0').join('')
        : Array.from({length: 6}, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
        
      newElements.push({
        id: `code-${i}`,
        type: 'code',
        text: isBinary ? text : `0x${text}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 14 + 10,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 10
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
              initial={{ y: '110vh', x: `${el.x}vw`, opacity: 0 }}
              animate={{ y: '-10vh', opacity: [0, 0.4, 0.4, 0] }}
              transition={{ duration: el.duration, repeat: Infinity, delay: el.delay, ease: "linear" }}
              style={{ position: 'absolute', color: 'rgba(37, 99, 235, 0.2)', fontFamily: 'monospace', fontSize: el.size, fontWeight: 'bold' }}
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
              initial={{ y: '110vh', x: `${el.x}vw`, opacity: 0, rotate: 0 }}
              animate={{ y: '-20vh', opacity: [0, 0.15, 0.15, 0], rotate: 360 }}
              transition={{ duration: el.duration, repeat: Infinity, delay: el.delay, ease: "linear" }}
              style={{ position: 'absolute', color: 'var(--primary)' }}
            >
              <IconComponent size={el.size} />
            </motion.div>
          );
        }
      })}
    </div>
  );
};
