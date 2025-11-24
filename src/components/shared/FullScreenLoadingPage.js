/**
 * Full Screen Loading Page Component
 *
 * Sophisticated animated loading screen with theme integration
 * Features: particle effects, shimmer animations, glass-morphism
 */
import React from 'react';
import { Box, Typography, LinearProgress, useTheme, alpha, keyframes } from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';

// ==================== ANIMATIONS ====================

// Smooth pulsing animation
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.85;
  }
`;

// Floating animation
const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
`;

// Shimmer wave effect
const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Rotation for orbit rings
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Particle orbit animation
const orbit = keyframes`
  0% {
    transform: rotate(0deg) translateX(80px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(80px) rotate(-360deg);
  }
`;

// Fade in animation
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Text shimmer
const textShimmer = keyframes`
  0% {
    background-position: -500px 0;
  }
  100% {
    background-position: 500px 0;
  }
`;

// Scale fade animation for particles
const scaleFade = keyframes`
  0%, 100% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
`;

const FullScreenLoadingPage = ({ message = 'Loading' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Theme-aware colors
  const primaryColor = theme.palette.text.primary;
  const secondaryColor = theme.palette.text.secondary;
  const backgroundColor = theme.palette.background.default;
  const glassBackground = isDark
    ? alpha(theme.palette.grey[900], 0.3)
    : alpha(theme.palette.grey[100], 0.5);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: backgroundColor,
        zIndex: 9999,
        overflow: 'hidden',
        animation: `${fadeIn} 0.4s ease-out`,
      }}
    >
      {/* Animated background particles */}
      {[...Array(8)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            bgcolor: alpha(primaryColor, 0.15),
            animation: `${scaleFade} ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
            top: `${20 + (i * 10)}%`,
            left: `${10 + (i * 10)}%`,
          }}
        />
      ))}

      {/* Main content container */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: `${float} 4s ease-in-out infinite`,
        }}
      >
        {/* Outer rotating ring */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 180,
            height: 180,
            border: `2px solid ${alpha(primaryColor, 0.1)}`,
            borderRadius: '50%',
            animation: `${rotate} 15s linear infinite`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: '50%',
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: alpha(primaryColor, 0.4),
              transform: 'translateX(-50%)',
            },
          }}
        />

        {/* Middle rotating ring */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 140,
            height: 140,
            border: `2px dashed ${alpha(primaryColor, 0.15)}`,
            borderRadius: '50%',
            animation: `${rotate} 10s linear infinite reverse`,
          }}
        />

        {/* Glowing pulse ring */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(primaryColor, 0.15)} 0%, transparent 70%)`,
            animation: `${pulse} 2.5s ease-in-out infinite`,
          }}
        />

        {/* Orbiting particles */}
        {[0, 120, 240].map((angle, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: alpha(primaryColor, 0.5),
              animation: `${orbit} ${8 + i}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: `0 0 10px ${alpha(primaryColor, 0.3)}`,
            }}
          />
        ))}

        {/* Glass-morphism icon container */}
        <Box
          sx={{
            position: 'relative',
            width: 100,
            height: 100,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: glassBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(primaryColor, 0.2)}`,
            boxShadow: `
              0 8px 32px ${alpha(primaryColor, 0.15)},
              inset 0 1px 0 ${alpha('#ffffff', 0.1)}
            `,
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '200%',
              height: '100%',
              background: `linear-gradient(
                90deg,
                transparent,
                ${alpha(primaryColor, 0.2)},
                transparent
              )`,
              animation: `${shimmer} 3s infinite`,
            },
          }}
        >
          <BotIcon
            sx={{
              fontSize: 56,
              color: primaryColor,
              filter: `drop-shadow(0 2px 8px ${alpha(primaryColor, 0.3)})`,
              animation: `${pulse} 2.5s ease-in-out infinite`,
            }}
          />
        </Box>
      </Box>

      {/* Loading text with shimmer effect */}
      <Box sx={{ mt: 8, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            mb: 1,
            background: `linear-gradient(
              90deg,
              ${primaryColor},
              ${alpha(primaryColor, 0.6)},
              ${primaryColor}
            )`,
            backgroundSize: '200% auto',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${textShimmer} 3s linear infinite`,
          }}
        >
          {message}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: secondaryColor,
            mb: 3,
            animation: `${fadeIn} 0.6s ease-out 0.3s both`,
          }}
        >
          Please wait while we prepare everything
        </Typography>

        {/* Progress bar */}
        <Box sx={{ width: 280, mx: 'auto' }}>
          <LinearProgress
            sx={{
              height: 3,
              borderRadius: 2,
              bgcolor: alpha(primaryColor, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                background: `linear-gradient(90deg, ${alpha(primaryColor, 0.6)}, ${primaryColor})`,
              },
            }}
          />
        </Box>
      </Box>

      {/* Animated indicator dots */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          mt: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: primaryColor,
              opacity: 0.3,
              animation: `${scaleFade} 1.8s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </Box>

      {/* Bottom decorative wave */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          background: `linear-gradient(
            to top,
            ${alpha(primaryColor, 0.03)},
            transparent
          )`,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default FullScreenLoadingPage;
