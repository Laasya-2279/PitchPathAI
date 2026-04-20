'use client';

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

/**
 * AR Navigation View
 * 
 * Full-screen camera feed with Three.js directional arrow overlay.
 * Shows animated 3D arrows pointing toward the next navigation step.
 * The arrows change direction based on the current route step.
 */
export default function ARView({ route, currentStep = 0, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const animationRef = useRef(null);
  const sceneRef = useRef(null);

  // Start camera
  useEffect(() => {
    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('Camera access denied. Using simulated view.');
        setCameraActive(true); // Still show the AR overlay
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer with transparency
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Create directional arrow
    const arrowGroup = new THREE.Group();

    // Arrow body (cone)
    const coneGeometry = new THREE.ConeGeometry(0.3, 1.2, 4);
    const coneMaterial = new THREE.MeshPhongMaterial({
      color: 0x6366f1,
      emissive: 0x3730a3,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9,
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = -0.3;
    arrowGroup.add(cone);

    // Arrow shaft
    const shaftGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    const shaftMaterial = new THREE.MeshPhongMaterial({
      color: 0x818cf8,
      emissive: 0x4338ca,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.rotation.x = -Math.PI / 2;
    shaft.position.z = 0.5;
    arrowGroup.add(shaft);

    // Glowing ring
    const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1;
    arrowGroup.add(ring);

    // Second glow ring
    const ring2Geometry = new THREE.RingGeometry(0.8, 0.85, 32);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -1;
    arrowGroup.add(ring2);

    scene.add(arrowGroup);

    // Store refs
    sceneRef.current = { scene, camera, renderer, arrowGroup, ring, ring2 };

    // Animation loop
    let time = 0;
    function animate() {
      time += 0.016;
      animationRef.current = requestAnimationFrame(animate);

      // Floating animation
      arrowGroup.position.y = Math.sin(time * 2) * 0.15;

      // Subtle rotation when pointing forward
      arrowGroup.rotation.y = Math.sin(time * 0.5) * 0.1;

      // Pulsing ring
      const scale = 1 + Math.sin(time * 3) * 0.15;
      ring.scale.set(scale, scale, scale);
      ring2.scale.set(scale * 0.9, scale * 0.9, scale * 0.9);
      ring.material.opacity = 0.3 + Math.sin(time * 3) * 0.15;
      ring2.material.opacity = 0.15 + Math.sin(time * 3) * 0.1;

      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    function handleResize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
    };
  }, []);

  // Update arrow direction based on route step
  useEffect(() => {
    if (!sceneRef.current || !route?.steps) return;

    const { arrowGroup } = sceneRef.current;
    const step = route.steps[currentStep];

    if (!step) return;

    // Rotate arrow based on direction
    let targetRotation = 0;
    switch (step.direction) {
      case 'to the right': targetRotation = -Math.PI / 2; break;
      case 'to the left': targetRotation = Math.PI / 2; break;
      case 'ahead': targetRotation = 0; break;
      case 'arrive': targetRotation = 0; break;
      default: targetRotation = 0;
    }

    // Smooth rotation animation
    const startRotation = arrowGroup.rotation.y;
    let t = 0;
    function smoothRotate() {
      t += 0.05;
      if (t >= 1) {
        arrowGroup.rotation.y = targetRotation;
        return;
      }
      arrowGroup.rotation.y = startRotation + (targetRotation - startRotation) * t;
      requestAnimationFrame(smoothRotate);
    }
    smoothRotate();
  }, [currentStep, route]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100vh', background: '#000' }}>
      {/* Camera feed */}
      {!cameraError ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        /* Simulated camera background for when camera isn't available */
        <div className="absolute inset-0 w-full h-full" style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)',
        }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="text-center">
              <p className="text-6xl mb-4">📷</p>
              <p className="text-white text-sm">Simulated Camera View</p>
            </div>
          </div>
          {/* Simulated environment lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="20" y1="100" x2="45" y2="40" stroke="white" strokeWidth="0.2" />
            <line x1="80" y1="100" x2="55" y2="40" stroke="white" strokeWidth="0.2" />
            <line x1="0" y1="60" x2="100" y2="60" stroke="white" strokeWidth="0.1" />
            <line x1="0" y1="70" x2="100" y2="70" stroke="white" strokeWidth="0.1" />
            <line x1="0" y1="80" x2="100" y2="80" stroke="white" strokeWidth="0.1" />
          </svg>
        </div>
      )}

      {/* Three.js overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 10, pointerEvents: 'none' }}
      />

      {/* Direction label overlay */}
      {route?.steps?.[currentStep] && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 fade-in">
          <div className="glass px-6 py-3 rounded-2xl text-center" style={{ minWidth: 200 }}>
            <p className="text-white text-lg font-semibold">
              {route.steps[currentStep].direction === 'start' ? '📍 Starting Point' :
               route.steps[currentStep].direction === 'arrive' ? '🏁 Destination' :
               route.steps[currentStep].direction === 'to the right' ? '➡️ Turn Right' :
               route.steps[currentStep].direction === 'to the left' ? '⬅️ Turn Left' :
               '⬆️ Go Ahead'}
            </p>
            <p className="text-gray-300 text-sm mt-1">{route.steps[currentStep].instruction}</p>
          </div>
        </div>
      )}

      {/* ETA badge */}
      {route && (
        <div className="absolute top-24 right-4 z-20">
          <div className="glass px-3 py-2 rounded-xl text-center">
            <p className="text-xs text-gray-400">ETA</p>
            <p className="text-white font-bold text-lg">{route.estimatedTime}m</p>
          </div>
        </div>
      )}

      {/* Step progress */}
      {route?.steps && (
        <div className="absolute bottom-32 left-4 right-4 z-20">
          <div className="flex gap-1.5">
            {route.steps.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background: i <= currentStep ? '#6366f1' : 'rgba(255,255,255,0.2)',
                  boxShadow: i === currentStep ? '0 0 8px rgba(99, 102, 241, 0.5)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-30 glass w-10 h-10 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          ✕
        </button>
      )}
    </div>
  );
}

ARView.propTypes = {
  /** The navigation route object returned from backend */
  route: PropTypes.shape({
    path: PropTypes.arrayOf(PropTypes.string),
    pathNames: PropTypes.arrayOf(PropTypes.string),
    estimatedTime: PropTypes.number,
    distance: PropTypes.number,
    steps: PropTypes.arrayOf(PropTypes.shape({
      instruction: PropTypes.string,
      direction: PropTypes.string,
    })),
  }),
  /** Index of the current step in the route */
  currentStep: PropTypes.number,
  /** Callback to close the AR view */
  onClose: PropTypes.func,
};
