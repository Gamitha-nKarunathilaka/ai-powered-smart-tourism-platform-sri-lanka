{/* Header Section */}
import { useState, useRef } from "react";
import Draggable from "react-draggable";
import { FaArrowUp, FaMapMarkerAlt, FaCarSide } from "react-icons/fa";
import { MdTurnLeft, MdTurnRight, MdTurnSlightLeft, MdTurnSlightRight, MdRoundaboutRight } from "react-icons/md";

const getDirectionIcon = (instruction) => {
  if (!instruction) return <FaCarSide size={20} className="text-white/70" />;
  
  const text = instruction.toLowerCase();
  
  if (text.includes("slight left")) return <MdTurnSlightLeft size={24} className="text-[#22d3ee]" />;
  if (text.includes("slight right")) return <MdTurnSlightRight size={24} className="text-[#22d3ee]" />;
  if (text.includes("left")) return <MdTurnLeft size={24} className="text-[#22d3ee]" />;
  if (text.includes("right")) return <MdTurnRight size={24} className="text-[#22d3ee]" />;
  if (text.includes("roundabout")) return <MdRoundaboutRight size={24} className="text-[#22d3ee]" />;
  if (text.includes("arrive") || text.includes("destination")) return <FaMapMarkerAlt size={20} className="text-red-400" />;
  if (text.includes("head") || text.includes("straight") || text.includes("continue")) return <FaArrowUp size={20} className="text-[#22d3ee]" />;
  

  return <FaCarSide size={20} className="text-white/70" />;
};

export default function DirectionPanel({ routeSteps, activeStep, onFocusStep }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const nodeRef = useRef(null);

  if (!routeSteps || routeSteps.length === 0) return null;

  return (
    <Draggable bounds="parent" handle=".drag-handle" nodeRef={nodeRef}>
      <div 
        ref={nodeRef} 
        className="absolute top-4 left-4 z-[1000] w-[350px] flex flex-col rounded-2xl shadow-2xl bg-[#071a33]/95 border border-white/10 backdrop-blur-md overflow-hidden"
      >
        
        {/* Header Section */}
        <div className="drag-handle p-4 bg-gradient-to-r from-[#0a2540] to-[#071a33] cursor-move flex justify-between items-center">
          <div onClick={() => setIsCollapsed(!isCollapsed)} className="cursor-pointer flex-1">
            <p className="text-xs text-white/50 font-bold mb-1">CURRENT DIRECTION</p>
            <h3 className="text-white font-semibold text-sm">
              Click to {isCollapsed ? "Expand" : "Collapse"} Directions
            </h3>
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-2 cursor-pointer"
          >
            {isCollapsed ? "▼" : "▲"}
          </button>
        </div>

        {/* Scrollable List Section */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto max-h-[50vh] p-3 space-y-2 custom-scrollbar">
            {routeSteps.map((step, index) => (
              <div 
                key={index}
                onClick={() => onFocusStep(index)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors flex gap-4 items-center ${
                  activeStep === index 
                    ? "bg-[#1a365d] border-[#22d3ee]" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
               
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  activeStep === index ? "bg-[#f4c542]/20" : "bg-white/10"
                }`}>
                  {getDirectionIcon(step.instruction)}
                </div>

                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{step.instruction}</p>
                  <span className="text-xs text-white/60">{step.distance} • {step.duration}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Draggable>
  );
}