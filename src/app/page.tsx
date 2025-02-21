import dynamic from "next/dynamic";

const Game = dynamic(() => import("./components/Game"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-2xl font-bold text-white">Loading game... Pookie says hi :3</div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen bg-black">
      <Game />
    </main>
  );
}
