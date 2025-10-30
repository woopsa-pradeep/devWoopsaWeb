// OrderCelebration.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Fade, Zoom } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import rabbitGif from '../../assets/gifs/Loader1.gif';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const CelebrationContainer = styled(Box)(() => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}));

const BlurBackground = styled(Box)(() => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(94, 94, 94, 0.45)',
  backdropFilter: 'blur(8px)',
  zIndex: -1,
}));

const ContentBox = styled(Box)(() => ({
  position: 'relative',
  textAlign: 'center',
  zIndex: 10,
  padding: '80px',
  background: 'rgba(255, 255, 255, 0.6)', // #3C7795 with 0.8 opacity
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  animation: `${float} 3s ease-in-out infinite`,
}));

const ThankYouContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  marginBottom: '20px',
}));

const ThankYouText = styled(Typography)(() => ({
  fontSize: '2rem',
  fontWeight: 700,
  background: '#3C7795',  // #3C7795 with 0.8 opacity
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  textShadow: '0 4px 12px rgba(0,0,0,0.3)',
  fontFamily: 'Poppins, sans-serif',
  letterSpacing: '0.15em',
}));

// const RabbitBox = styled(Box)(() => ({
//   width: '100px',
//   height: '100px',
//   backgroundColor: '',
//   borderRadius: '8px',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   '& img': {
//     width: '60px',
//     height: '60px',
//   }
// }));

const SubText = styled(Typography)(() => ({
  fontSize: '1rem',
  color: '#3C7795',  // #3C7795 with 0.8 opacity
  fontWeight: 300,
  marginTop: '10px',
}));

const Star = styled('div')(({ top, left, delay }: { top: string; left: string; delay: string }) => ({
  position: 'absolute',
  top,
  left,
  width: '4px',
  height: '4px',
  background: '#fff',
  borderRadius: '50%',
  animation: `${sparkle} 1.5s ease-in-out infinite`,
  animationDelay: delay,
  boxShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff',
  zIndex: 5,
}));

const RotatingCircle = styled('div')(() => ({
  position: 'absolute',
  width: '200px',
  height: '200px',
  border: '2px solid rgba(71, 70, 70, 0.1)',
  borderRadius: '50%',
  animation: `${rotate} 10s linear infinite`,
  zIndex: 5,
}));

interface OrderCelebrationProps {
  open: boolean;
  onClose: () => void;
}

const OrderCelebration: React.FC<OrderCelebrationProps> = ({ open, onClose }) => {
  const [show, setShow] = useState(false);

  const fireworkColors = ['#FFD93D', '#FF6B6B', '#6BCB77', '#4D96FF', '#FF9FF3'];

  useEffect(() => {
    if (!open) return;

    setShow(true);
    import('canvas-confetti').then(({ default: confetti }) => {
      const duration = 5000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9000';
        document.body.appendChild(canvas);

        const myConfetti = confetti.create(canvas, {
          resize: true,
          useWorker: true,
        });

        myConfetti({
          particleCount: 100,
          startVelocity: 30,
          spread: 360,
          origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.9) },
          colors: fireworkColors,
          ticks: 60,
          gravity: 0.8,
          scalar: 1.2,
          shapes: ['star', 'circle'],
        });

        setTimeout(() => {
          canvas.remove();
        }, 2000);
      }, 250);
    });

    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 500);
    }, 6000);

    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <CelebrationContainer>
      <BlurBackground />
      <RotatingCircle style={{ transform: 'rotate(30deg)' }} />
      <RotatingCircle style={{ width: '300px', height: '300px', animationDirection: 'reverse' }} />
      
      {[...Array(20)].map((_, i) => (
        <Star
          key={i}
          top={`${Math.random() * 100}%`}
          left={`${Math.random() * 100}%`}
          delay={`${Math.random() * 2}s`}
        />
      ))}

      <Fade in={show} timeout={1000}>
        <ContentBox>
          <Zoom in={show} timeout={1500}>
            <Box>
              <ThankYouContainer>
                <ThankYouText>Thank You!</ThankYouText>
                {/* <RabbitBox> */}
                  <img src={rabbitGif} alt="Running Rabbit" style={{ width: '60px', height: '60px' }} />
                {/* </RabbitBox> */}
              </ThankYouContainer>
              <SubText>Your order has been confirmed</SubText>
            </Box>
          </Zoom>
        </ContentBox>
      </Fade>
    </CelebrationContainer>
  );
};

export default OrderCelebration;
