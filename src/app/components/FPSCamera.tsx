import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Bullet from "./Bullet";
import GunViewModel from "./GunViewModel";

interface FPSCameraProps {
  playerId: string | null;
  ws?: WebSocket | null;
  onPositionUpdate?: (position: THREE.Vector3, rotation: THREE.Euler) => void;
  onAmmoChange?: (ammo: number, reloading: boolean) => void;
  onGrenadeChange?: (grenades: number) => void;
  isPaused: boolean;
  onUnpause: () => void;
  onSlide: () => void;
}

export default function FPSCamera({
  playerId,
  ws,
  onPositionUpdate,
  onAmmoChange,
  onGrenadeChange,
  onSlide,
  isPaused,
  onUnpause,
}: FPSCameraProps) {
  const { camera, raycaster, scene } = useThree();
  const controls = useRef({
    rotation: { x: 0, y: 0 },
    position: { x: 0, y: 1.7, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    recoil: 0,
    moveSpeed: 0.25,
    slideSpeed: 0.4,
    slideJump: 0.4,
    lookSpeed: 0.003,
    gravity: 0.0060,
    jumpForce: 0.3,
    isGrounded: true,
  });

  const playerModelRef = useRef<THREE.Group>(null);
  const playerBodyRef = useRef<THREE.Mesh>(null);
  const playerGunRef = useRef<THREE.Group>(null);

  const listener = new THREE.AudioListener();
  camera.add( listener );

  const sound = new THREE.Audio( listener );
  const audioLoader = new THREE.AudioLoader();

  audioLoader.load("audio/ambient_music.mp3", function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop( true );
    sound.setVolume( 0.5 );
    sound.play();
  });

  const maxAmmo = 30;
  const maxGrenades = 5;
  const reloadTime = 2000;
  const slidingTime = 500;
  const [ammo, setAmmo] = useState<number>(maxAmmo);
  const [grenades, setGrenades] = useState<number>(maxGrenades);
  const [reloading, setReloading] = useState<boolean>(false);
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    if (onAmmoChange) {
      onAmmoChange(ammo, reloading);
    }
  }, [ammo, reloading, onAmmoChange]);

  useEffect(() => {
    if (onGrenadeChange) {
      onGrenadeChange(grenades);
    }
  }, [grenades, onGrenadeChange])

  useEffect(() => {
    if (onSlide) {
      onSlide();
    }
  }, [sliding, onSlide])

  const lastShotRef = useRef(0);
  const [bullets, setBullets] = useState<
    { id: number; start: THREE.Vector3; direction: THREE.Vector3 }[]
  >([]);
  const bulletIdRef = useRef(0);
  const FIRE_RATE = 100;
  const isShootingRef = useRef(false);

  const keyState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  // Visual Studio Code hates this line.
  function reload() {
    if (reloading) return;
    setReloading(true);
    setTimeout(() => {
      setAmmo(maxAmmo);
      setReloading(false);
    }, reloadTime);
  }

  function shootSlide() {
    if (!sliding) {
      setSliding(true);
      const slideTilt = -0.25;
      controls.current.rotation.x = controls.current.recoil + slideTilt;

      setTimeout(() => {
        setSliding(false);
        controls.current.rotation.x = 0;
      }, slidingTime)
    }
  }

  function shootGrenade() {
    if (grenades > 0) {
      console.log("shooting grenades");

      setGrenades((prev) => prev - 1);
    }
  }

  function shoot() {
    if (reloading || ammo <= 0) {
      if (ammo <= 0 && !reloading) {
        reload();
      }
      return;
    }
    const now = Date.now();
    if (now - lastShotRef.current < FIRE_RATE) return;
    lastShotRef.current = now;

    setAmmo((prev) => prev - 1);
    controls.current.recoil -= 0.02;
    setMuzzleFlash(true);
    setTimeout(() => setMuzzleFlash(false), 50);

    if (ws && playerId) {
      ws.send(JSON.stringify({ type: "player-shoot", payload: { playerId } }));
    }

    const bulletStart = camera.position.clone();
    bulletStart.y -= 0.1;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.quaternion
    );
    bulletStart.add(forward.multiplyScalar(0.5));

    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.quaternion
    );

    raycaster.set(bulletStart, direction.normalize());
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.object.userData.isTarget && hit.object.userData.onHit) {
        hit.object.userData.onHit();
      } else if (
        hit.object.userData.isPlayer &&
        hit.object.userData.playerId !== playerId
      ) {
        if (ws && playerId) {
          ws.send(
            JSON.stringify({
              type: "player-hit",
              payload: { targetId: hit.object.userData.playerId },
            })
          );
        }
      }
    }

    const bulletId = bulletIdRef.current++;
    setBullets((prev) => [
      ...prev,
      { id: bulletId, start: bulletStart, direction },
    ]);

    setTimeout(() => {
      setBullets((prev) => prev.filter((b) => b.id !== bulletId));
    }, 500);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isPaused && e.code !== "Space") return;

      // Switch the key codes
      switch (e.code) {
        // W
        case "KeyW":
          keyState.current.forward = true;
          break;
        // S
        case "KeyS":
          keyState.current.backward = true;
          break;
        // A
        case "KeyA":
          keyState.current.left = true;
          break;
        // D
        case "KeyD":
          keyState.current.right = true;
          break;
        // Space
        case "Space":
          if (isPaused) {
            onUnpause();
          } else if (controls.current.isGrounded) {
            controls.current.velocity.y = controls.current.jumpForce;
            controls.current.isGrounded = false;
          }
          break;
        case "KeyQ":
          shootSlide();
          break;
        // R
        case "KeyR":
          if (!reloading && ammo < maxAmmo) {
            reload();
          }
          break;
        // G
        case "KeyG":
          shootGrenade();
          break;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (isPaused) return;

      switch (e.code) {
        // W
        case "KeyW":
          keyState.current.forward = false;
          break;
        // S
        case "KeyS":
          keyState.current.backward = false;
          break;
        // A
        case "KeyA":
          keyState.current.left = false;
          break;
        // D
        case "KeyD":
          keyState.current.right = false;
          break;
      }
    }

    function handleMouseDown(e: MouseEvent) {
      if (isPaused) return;

      if (e.button === 0) {
        isShootingRef.current = true;
      } else if (e.button === 2) {
        setIsAiming(true);
      }
    }

    function handleMouseUp(e: MouseEvent) {
      if (isPaused) return;

      if (e.button === 0) {
        isShootingRef.current = false;
      } else if (e.button === 2) {
        setIsAiming(false);
      }
    }

    function updateRotation(e: MouseEvent) {
      if (isPaused) return;

      controls.current.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(
          Math.PI / 2,
          controls.current.rotation.x - e.movementY * controls.current.lookSpeed
        )
      );
      controls.current.rotation.y -= e.movementX * controls.current.lookSpeed;
    }

    function lockControls() {
      document.body.requestPointerLock();
    }

    function handleLockChange() {
      //isLocked = document.pointerLockElement === document.body;
    }

    function handleContextMenu(e: Event) {
      e.preventDefault();
    }

    // Add listeners (Cant wait for firefox to crash on this code)
    document.addEventListener("keydown", handleKeyDown); // Key down
    document.addEventListener("keyup", handleKeyUp); // Key up
    document.addEventListener("mousedown", handleMouseDown); // Mouse down
    document.addEventListener("mouseup", handleMouseUp); // Mouse up
    document.addEventListener("mousemove", updateRotation); // Mouse move
    document.addEventListener("click", lockControls); // Click
    document.addEventListener("pointerlockchange", handleLockChange); // Pointer lock change
    document.addEventListener("contextmenu", handleContextMenu); // Content menu

    return () => {
      document.removeEventListener("keydown", handleKeyDown); // Key down
      document.removeEventListener("keyup", handleKeyUp); // Key up
      document.removeEventListener("mousedown", handleMouseDown); // Mouse down
      document.removeEventListener("mouseup", handleMouseUp); // Mouse up
      document.removeEventListener("mousemove", updateRotation); // Mouse move
      document.removeEventListener("click", lockControls); // Click
      document.removeEventListener("pointerlockchange", handleLockChange); // Pointer lock change
      document.removeEventListener("contextmenu", handleContextMenu); // Content menu
    };
  }, [isPaused, onUnpause, ammo, reloading, reload]);

  const [isAiming, setIsAiming] = useState(false);

  useFrame(() => {
    if (isShootingRef.current) {
      shoot(); // Shoot
    }

    controls.current.recoil *= 0.95;

    let speed = sliding ? controls.current.slideSpeed : controls.current.moveSpeed;
    const angle = controls.current.rotation.y;
    const newPosition = { ...controls.current.position };

    if (!controls.current.isGrounded) {
      controls.current.velocity.y -= controls.current.gravity;
    }
    newPosition.y += controls.current.velocity.y;

    let isOnPlatform = false;
    const playerY = newPosition.y - 1.7;
    // Le boxes
    const platformBoxes = [
      { min: [-7, 1.5, -12], max: [-3, 2, -8] },
      { min: [3, 2, -17], max: [7, 2.5, -13] },
      { min: [-10, 3, -22], max: [-6, 3.5, -18] },
      { min: [6, 2, -27], max: [10, 2.5, -23] },
      { min: [-2, 2.5, -32], max: [2, 3, -28] },
      { min: [-3, 1.75, -14], max: [-1, 2.05, -10] },
      { min: [1, 2, -19], max: [3, 2.3, -15] },
      { min: [-5, 2.25, -24], max: [-3, 2.55, -20] },
      { min: [3, 2.25, -29], max: [5, 2.55, -25] },
    ];

    for (const box of platformBoxes) {
      if (
        newPosition.x >= box.min[0] &&
        newPosition.x <= box.max[0] &&
        newPosition.z >= box.min[2] &&
        newPosition.z <= box.max[2]
      ) {
        if (playerY >= box.min[1] && playerY <= box.max[1] + 0.1) {
          isOnPlatform = true;
          newPosition.y = box.max[1] + 1.7;
          controls.current.velocity.y = 0;
          controls.current.isGrounded = true;
          break;
        }
      }
    }

    if (!isOnPlatform && newPosition.y > 1.7) {
      controls.current.isGrounded = false;
    }
    if (!isOnPlatform && newPosition.y <= 1.7) {
      newPosition.y = 1.7;
      controls.current.velocity.y = 0;
      controls.current.isGrounded = true;
    }
    if (keyState.current.forward) {
      newPosition.x -= Math.sin(angle) * speed;
      newPosition.z -= Math.cos(angle) * speed;
    }
    if (keyState.current.backward) {
      newPosition.x += Math.sin(angle) * speed;
      newPosition.z += Math.cos(angle) * speed;
    }
    if (keyState.current.left) {
      newPosition.x -= Math.cos(angle) * speed;
      newPosition.z += Math.sin(angle) * speed;
    }
    if (keyState.current.right) {
      newPosition.x += Math.cos(angle) * speed;
      newPosition.z -= Math.sin(angle) * speed;
    }

    const radius = 0.5;
    if (
      Math.abs(newPosition.x) < 49 - radius &&
      Math.abs(newPosition.z) < 49 - radius
    ) {
      controls.current.position = newPosition;
    }

    camera.position.set(
      controls.current.position.x,
      controls.current.position.y,
      controls.current.position.z
    );
    camera.rotation.order = "YXZ";
    camera.rotation.x = controls.current.rotation.x - controls.current.recoil;
    camera.rotation.y = controls.current.rotation.y;

    if (playerModelRef.current) {
      playerModelRef.current.position.set(
        controls.current.position.x,
        controls.current.position.y - 0.7,
        controls.current.position.z
      );
      playerModelRef.current.rotation.set(0, controls.current.rotation.y, 0);
    }
    if (playerBodyRef.current) {
      playerBodyRef.current.position.set(0, 0, 0);
    }
    if (playerGunRef.current) {
      playerGunRef.current.position.set(0.3, 0.5, 0);
    }
    if (playerId && onPositionUpdate) {
      onPositionUpdate(
        camera.position.clone(),
        new THREE.Euler(
          controls.current.rotation.x,
          controls.current.rotation.y,
          0
        )
      );
    }

    console.log(speed)
    console.log(controls.current.position.y)
  });

  return (
    <>
      <GunViewModel isAiming={isAiming} muzzleFlash={muzzleFlash} />
      <group ref={playerModelRef}>
        <mesh ref={playerBodyRef}>
          <capsuleGeometry args={[0.3, 1, 4, 8]} />
          <meshStandardMaterial
            color="#44ff44"
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>
        <group ref={playerGunRef}>
          <mesh>
            <boxGeometry args={[0.1, 0.1, 0.4]} />
            <meshStandardMaterial
              color="#2a2a2a"
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
        </group>
      </group>
      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          start={bullet.start}
          direction={bullet.direction}
          onHit={() => {
            setBullets((prev) => prev.filter((b) => b.id !== bullet.id));
          }}
        />
      ))}
    </>
  );
}
