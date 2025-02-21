"use client";
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import World from "./World";
import HUD from "./HUD";
import useGameSocket from "../../hooks/useGameSocket";

export default function Game() {
  const { ws, connected } = useGameSocket(
    `wss://xyz-worker.stupidthings.workers.dev/websocket`
  );

  const [ammo, setAmmo] = useState<number>(30);
  const [reloading, setReloading] = useState<boolean>(false);
  const [health, setHealth] = useState<number>(100);
  const [playersCount, setPlayersCount] = useState<number>(0);
  const [mapId, setMapId] = useState<number>(1); // add the thing that tells you which fking map you're on

  const handleAmmoUpdate = (newAmmo: number, isReloading: boolean) => {
    setAmmo(newAmmo);
    setReloading(isReloading);
  };
  const handleHealthUpdate = (newHealth: number) => {
    setHealth(newHealth);
  };
  const handlePlayersUpdate = (
    remotePlayersCount: number,
    localPlayerExists: boolean
  ) => {
    setPlayersCount(remotePlayersCount + (localPlayerExists ? 1 : 0));
  };

  return (
    <div className="w-full h-screen relative">
      <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000 }}>
        <World
          ws={ws}
          onAmmoUpdate={handleAmmoUpdate}
          onHealthUpdate={handleHealthUpdate}
          onPlayersUpdate={handlePlayersUpdate}
          mapId={mapId} // Pass mapId to World component
        />
      </Canvas>
      <HUD ammo={ammo} reloading={reloading} health={health} />
      <div className="absolute top-4 left-4 bg-black/50 p-4 rounded text-white">
        <h2 className="text-xl font-bold">Connection Status</h2>
        <p>Connected: {connected ? "Yes" : "No"}</p>
        <p>Players: {playersCount}</p>
      </div>
      <div className="absolute top-4 right-4 bg-black/50 p-4 rounded text-white">
        <h2 className="text-xl font-bold">Controls</h2>
        <ul>
          <li>Click to start</li>
          <li>WASD - Move</li>
          <li>Space - Jump</li>
          <li>Mouse - Look</li>
          <li>Left Click - Shoot</li>
          <li>Right Click - Aim</li>
          <li>R - Reload</li>
          <li>ESC - Release mouse</li>
        </ul>
      </div>
      <div className="absolute bottom-4 left-4 bg-black/50 p-4 rounded text-white">
        <h2 className="text-xl font-bold">Map Selection</h2> // this should probably be dynamically be rendered based on what maps are in storage, but does it look like i give a hickory smoked fck?
        <button onClick={() => setMapId(1)} className="btn-primary">Map 1</button>
        <button onClick={() => setMapId(2)} className="btn-primary">Map 2</button>
      </div>
    </div>
  );
}
