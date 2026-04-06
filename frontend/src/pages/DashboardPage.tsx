import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const cards = ["Conexões ativas", "Usuários ativos", "Canais", "Filmes"];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-sm tracking-widest uppercase text-[#666]">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((label) => (
          <div
            key={label}
            className="border border-[#1f1f1f] rounded p-4 space-y-2"
          >
            <p className="text-[10px] tracking-widest uppercase text-[#444]">
              {label}
            </p>
            <Skeleton
              baseColor="#141414"
              highlightColor="#1f1f1f"
              height={28}
              width={60}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-[10px] tracking-widest uppercase text-[#444]">
          Conexões recentes
        </h2>
        <div className="border border-[#1f1f1f] rounded overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 px-4 py-3 border-b border-[#141414]"
            >
              <Skeleton
                baseColor="#141414"
                highlightColor="#1f1f1f"
                height={10}
                width={100}
              />
              <Skeleton
                baseColor="#141414"
                highlightColor="#1f1f1f"
                height={10}
                width={80}
              />
              <Skeleton
                baseColor="#141414"
                highlightColor="#1f1f1f"
                height={10}
                width={60}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
