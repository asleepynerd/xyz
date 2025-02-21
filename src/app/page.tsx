import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const messages = [
  "you're looking cute tonight pookie :3",
  "hang tight, im almost there!",
  "loading... please wait",
  "good things come to those who wait",
  "just a moment, pookie!"
];

const getRandomMessage = () => messages[Math.floor(Math.random() * messages.length)]; // add a random message to the loading screen cause why not :3c

const Game = dynamic(() => import("./components/Game"), {
  ssr: false,
  loading: () => {
    const [message, setMessage] = useState(getRandomMessage());

    useEffect(() => {
      const timer = setTimeout(() => {
        setMessage("im going to touch you");
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-white">{message}</div>
      </div>
    );
  },
});

export default function Home() {
  return (
    <main className="w-full h-screen bg-black">
      <Game />
    </main>
  );
}
