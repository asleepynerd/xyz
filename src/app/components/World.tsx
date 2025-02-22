import React, { useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import FPSCamera from "./FPSCamera";
import PlayerModel from "./PlayerModel";
import Platform from "./Platform";
import Target from "./Target";
import { steve, bob } from "../../maps/config"; // fetch the fking map config
import type { Player } from "../../types/game";

interface WorldProps {
  ws: WebSocket | null;
  onAmmoUpdate: (ammo: number, reloading: boolean) => void;
  onHealthUpdate: (health: number) => void;
  onPlayersUpdate?: (
    remotePlayersCount: number,
    localPlayerExists: boolean
  ) => void;
  isPaused: boolean;
  onUnpause: () => void;
  onGrenadeUpdate: (grenades: number) => void;
  onSlide: () => void;
  mapId: number; // oh so you want to know which map you're on huh
}

export default function World({
  ws,
  onAmmoUpdate,
  onHealthUpdate,
  onPlayersUpdate, 
  mapId,
  onGrenadeUpdate,
  onSlide,
  isPaused,
  onUnpause,
}: WorldProps) {
  const [players, setPlayers] = useState<
    Map<string, { position: THREE.Vector3; rotation: THREE.Euler }>
  >(new Map());
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [remoteShooting, setRemoteShooting] = useState<Map<string, number>>(
    new Map()
  );

  // Handle smth
  const handlePositionUpdate = useCallback(
    (position: THREE.Vector3, rotation: THREE.Euler) => {
      if (ws && playerId) {
        ws.send(
          JSON.stringify({
            type: "player-update",
            payload: {
              id: playerId,
              position: { x: position.x, y: position.y, z: position.z },
              rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
            },
          })
        );
      }
    },
    [ws, playerId]
  );

  useEffect(() => {
    if (onPlayersUpdate) {
      onPlayersUpdate(players.size, playerId !== null);
    }
  }, [players, playerId, onPlayersUpdate]);

  useEffect(() => {
    if (!ws) return;

    // Handle messages
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        // Game state
        case "game-state": {
          const newPlayers = new Map();
          message.payload.players.forEach((player: Player) => {
            if (player.id !== playerId) {
              newPlayers.set(player.id, {
                position: new THREE.Vector3(
                  player.position.x,
                  player.position.y,
                  player.position.z
                ),
                rotation: new THREE.Euler(
                  player.rotation.x,
                  player.rotation.y,
                  player.rotation.z
                ),
              });
            } else {
              onHealthUpdate(player.health);
            }
          });
          setPlayers(newPlayers);
          if (!playerId && message.payload.playerId) {
            setPlayerId(message.payload.playerId);
          }
          break;
        }
        // Player join
        case "player-join": {
          if (message.payload.id !== playerId) {
            setPlayers((prev) => {
              const next = new Map(prev);
              next.set(message.payload.id, {
                position: new THREE.Vector3(
                  message.payload.position.x,
                  message.payload.position.y,
                  message.payload.position.z
                ),
                rotation: new THREE.Euler(
                  message.payload.rotation.x,
                  message.payload.rotation.y,
                  message.payload.rotation.z
                ),
              });
              return next;
            });
          }
          break;
        }
        // Player leave
        case "player-leave": {
          setPlayers((prev) => {
            const next = new Map(prev);
            next.delete(message.payload.playerId);
            return next;
          });
          break;
        }
        // Player update
        case "player-update": {
          if (message.payload.id !== playerId) {
            setPlayers((prev) => {
              const next = new Map(prev);
              next.set(message.payload.id, {
                position: new THREE.Vector3(
                  message.payload.position.x,
                  message.payload.position.y,
                  message.payload.position.z
                ),
                rotation: new THREE.Euler(
                  message.payload.rotation.x,
                  message.payload.rotation.y,
                  message.payload.rotation.z
                ),
              });
              return next;
            });
          } else {
            onHealthUpdate(message.payload.health);
          }
          break;
        }
        // Player hit
        case "player-hit": {
          if (message.payload.targetId === playerId) {
            onHealthUpdate(message.payload.health);
          }
          break;
        }
        // Player shoot
        case "player-shoot": {
          const shooterId = message.payload.playerId;
          if (shooterId && shooterId !== playerId) {
            setRemoteShooting((prev) => {
              const newMap = new Map(prev);
              newMap.set(shooterId, Date.now());
              return newMap;
            });
          }
          break;
        }
      }
    };

    // Send ws data (i think - ploszukiwacz)
    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws, playerId, onHealthUpdate]);

  // Select the map configuration based on mapId
  const mapConfig = mapId === 1 ? steve : bob;

  // Select the map configuration based on mapId
  const mapConfig = mapId === 1 ? steve : bob;

  // Reutrn the world (i think - ploszukiwacz)
  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <hemisphereLight args={["#7cc4ff", "#90f090", 1]} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#90f090" />
      </mesh>

      {/* Platforms */}
      {mapConfig.platforms.map((platform, index) => (
        <Platform key={index} position={platform.position} size={platform.size} />
      ))}

      {/* Walls */}
      {mapConfig.walls.map((wall, index) => (
        <mesh key={index} position={wall.position} receiveShadow castShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#4488ff" />
        </mesh>
      ))}

      {/* Targets */}
      {mapConfig.targets.map((target, index) => (
        <Target key={index} position={target.position} />
      ))}

      {/* Other Players */}
      {Array.from(players.entries()).map(([id, data]) => (
        <PlayerModel
          key={id}
          playerId={id}
          position={data.position}
          rotation={data.rotation}
          isShooting={
            remoteShooting.has(id) && Date.now() - remoteShooting.get(id)! < 100
          }
        />
      ))}

      {/* The First Person Shooter Camera */}
      <FPSCamera
        playerId={playerId}
        ws={ws}
        onPositionUpdate={handlePositionUpdate}
        onAmmoChange={onAmmoUpdate}
        isPaused={false} // idk if you have a better solution to take the red line away but here you go
        onUnpause={() => {}} // i did have to ask chatgpt what the hell that was  
        onSlide={onSlide}
        onGrenadeChange={onGrenadeUpdate}
        isPaused={isPaused}
        onUnpause={onUnpause}
      />
    </>
  );
}
