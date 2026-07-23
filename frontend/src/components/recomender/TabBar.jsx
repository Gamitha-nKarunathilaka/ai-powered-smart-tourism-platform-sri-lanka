import { TABS } from "../../constant";

export default function TabBar({ activeTab, onChange }) {
  return (
    <div className="flex overflow-x-auto border-b border-white/10">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`min-w-max flex items-center gap-4 px-5 lg:px-8 h-[54px] text-xs font-bold tracking-[1.5px] border-b-2 transition ${
            activeTab === tab.id
              ? "border-[#f4c542] text-white"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <span className="text-xl text-[#f4c542]">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}