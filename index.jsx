import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   MOTORCYCLE CENTRE OF GRAVITY (CoG) CALCULATOR
   ─────────────────────────────────────────────────────────────────────────
   Physics-based CoG computation for all two-wheeler families.
   Covers: Sport, Naked, ADV, Touring, Cruiser, Sport-Touring, Off-Road,
           Standard/Commuter, Scooter (ICE), EV Scooter, EV Motorcycle
   
   Formulae:
     X_cg = Σ(m_i · x_i) / Σ(m_i)
     Y_cg = Σ(m_i · y_i) / Σ(m_i)
     R_front = W_total × (WB − X_cg) / WB
     R_rear  = W_total × X_cg / WB
     ΔW_brake = m·a·Y_cg / WB
     ΔW_accel = m·a·Y_cg / WB
     ΔW_corner = m·a_lat·Y_cg / Track (lateral transfer)
     Trail = R·cos(rake)/sin(rake) − fork_offset
   ═══════════════════════════════════════════════════════════════════════════ */

const BIKE_FAMILIES = {
  sport: {
    name: "Sport / Supersport",
    icon: "🏍️",
    color: "#E63946",
    desc: "Forward lean, low bars, high rear-set pegs",
    defaults: {
      wheelbase: 1380, rakeAngle: 24, trail: 94, seatHeight: 835,
      forkOffset: 30, wheelRadius: 310, groundClearance: 160,
      dryWeight: 185, fuelCapacity: 17, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 55, engineX: 580, engineY: 340,
      frameWeight: 12, frameX: 690, frameY: 500,
      fuelTankWeight: 0, fuelTankX: 620, fuelTankY: 560,
      batteryWeight: 5, batteryX: 500, batteryY: 320,
      exhaustWeight: 8, exhaustX: 900, exhaustY: 350,
      swingarmWeight: 6, swingarmX: 1050, swingarmY: 350,
      riderX: 650, riderY: 750, pillionX: 850, pillionY: 700,
      luggageX: 950, luggageY: 650,
      frontBrakeForce: 0.95, rearBrakeForce: 0.6,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  naked: {
    name: "Naked / Roadster",
    icon: "🔧",
    color: "#457B9D",
    desc: "Upright torso, wider bars, mid-set pegs",
    defaults: {
      wheelbase: 1455, rakeAngle: 25, trail: 99, seatHeight: 820,
      forkOffset: 33, wheelRadius: 315, groundClearance: 170,
      dryWeight: 195, fuelCapacity: 15, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 52, engineX: 620, engineY: 350,
      frameWeight: 14, frameX: 728, frameY: 510,
      fuelTankWeight: 0, fuelTankX: 650, fuelTankY: 570,
      batteryWeight: 5, batteryX: 530, batteryY: 330,
      exhaustWeight: 9, exhaustX: 950, exhaustY: 360,
      swingarmWeight: 7, swingarmX: 1100, swingarmY: 360,
      riderX: 700, riderY: 770, pillionX: 900, pillionY: 720,
      luggageX: 1000, luggageY: 660,
      frontBrakeForce: 0.9, rearBrakeForce: 0.55,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  adventure: {
    name: "Adventure / Dual-Sport",
    icon: "⛰️",
    color: "#2A9D8F",
    desc: "Upright, wide bars, standing-friendly",
    defaults: {
      wheelbase: 1510, rakeAngle: 27, trail: 112, seatHeight: 855,
      forkOffset: 42, wheelRadius: 340, groundClearance: 200,
      dryWeight: 220, fuelCapacity: 20, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 58, engineX: 660, engineY: 370,
      frameWeight: 16, frameX: 755, frameY: 520,
      fuelTankWeight: 0, fuelTankX: 680, fuelTankY: 590,
      batteryWeight: 6, batteryX: 560, batteryY: 350,
      exhaustWeight: 10, exhaustX: 980, exhaustY: 380,
      swingarmWeight: 8, swingarmX: 1150, swingarmY: 380,
      riderX: 730, riderY: 800, pillionX: 930, pillionY: 740,
      luggageX: 1050, luggageY: 680,
      frontBrakeForce: 0.85, rearBrakeForce: 0.5,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  touring: {
    name: "Touring / Luxury",
    icon: "🛣️",
    color: "#6A0572",
    desc: "Very upright, comfort-first, long wheelbase",
    defaults: {
      wheelbase: 1695, rakeAngle: 29.5, trail: 109, seatHeight: 820,
      forkOffset: 42, wheelRadius: 325, groundClearance: 155,
      dryWeight: 350, fuelCapacity: 25, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 80, engineX: 750, engineY: 360,
      frameWeight: 22, frameX: 848, frameY: 520,
      fuelTankWeight: 0, fuelTankX: 760, fuelTankY: 590,
      batteryWeight: 8, batteryX: 650, batteryY: 340,
      exhaustWeight: 15, exhaustX: 1100, exhaustY: 380,
      swingarmWeight: 10, swingarmX: 1300, swingarmY: 370,
      riderX: 820, riderY: 780, pillionX: 1050, pillionY: 730,
      luggageX: 1200, luggageY: 680,
      frontBrakeForce: 0.85, rearBrakeForce: 0.55,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  cruiser: {
    name: "Cruiser / Power Cruiser",
    icon: "🦅",
    color: "#1D3557",
    desc: "Low seat, feet-forward pegs, reclined torso",
    defaults: {
      wheelbase: 1620, rakeAngle: 29, trail: 124, seatHeight: 770,
      forkOffset: 38, wheelRadius: 330, groundClearance: 145,
      dryWeight: 290, fuelCapacity: 18, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 72, engineX: 700, engineY: 350,
      frameWeight: 20, frameX: 810, frameY: 500,
      fuelTankWeight: 0, fuelTankX: 720, fuelTankY: 570,
      batteryWeight: 7, batteryX: 600, batteryY: 330,
      exhaustWeight: 14, exhaustX: 1050, exhaustY: 360,
      swingarmWeight: 9, swingarmX: 1250, swingarmY: 360,
      riderX: 780, riderY: 740, pillionX: 1000, pillionY: 700,
      luggageX: 1150, luggageY: 660,
      frontBrakeForce: 0.8, rearBrakeForce: 0.5,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  sportTouring: {
    name: "Sport-Touring / Crossover",
    icon: "🌐",
    color: "#E9C46A",
    desc: "Slight forward lean, wind protection",
    defaults: {
      wheelbase: 1575, rakeAngle: 24.3, trail: 107, seatHeight: 830,
      forkOffset: 35, wheelRadius: 320, groundClearance: 160,
      dryWeight: 250, fuelCapacity: 20, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 62, engineX: 680, engineY: 360,
      frameWeight: 17, frameX: 788, frameY: 520,
      fuelTankWeight: 0, fuelTankX: 700, fuelTankY: 580,
      batteryWeight: 6, batteryX: 580, batteryY: 340,
      exhaustWeight: 11, exhaustX: 1020, exhaustY: 370,
      swingarmWeight: 8, swingarmX: 1200, swingarmY: 370,
      riderX: 750, riderY: 780, pillionX: 960, pillionY: 730,
      luggageX: 1100, luggageY: 680,
      frontBrakeForce: 0.9, rearBrakeForce: 0.55,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  offroad: {
    name: "Off-Road / Motocross",
    icon: "🏔️",
    color: "#F4A261",
    desc: "Standing-friendly, narrow seat, high bars",
    defaults: {
      wheelbase: 1480, rakeAngle: 27, trail: 120, seatHeight: 920,
      forkOffset: 22, wheelRadius: 355, groundClearance: 320,
      dryWeight: 105, fuelCapacity: 8, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 28, engineX: 640, engineY: 420,
      frameWeight: 8, frameX: 740, frameY: 560,
      fuelTankWeight: 0, fuelTankX: 660, fuelTankY: 620,
      batteryWeight: 3, batteryX: 540, batteryY: 380,
      exhaustWeight: 5, exhaustX: 940, exhaustY: 430,
      swingarmWeight: 5, swingarmX: 1120, swingarmY: 400,
      riderX: 720, riderY: 860, pillionX: 920, pillionY: 800,
      luggageX: 1020, luggageY: 700,
      frontBrakeForce: 0.75, rearBrakeForce: 0.5,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  commuter: {
    name: "Standard / Commuter",
    icon: "🏙️",
    color: "#264653",
    desc: "Neutral upright, simple reach, low fatigue",
    defaults: {
      wheelbase: 1440, rakeAngle: 26, trail: 100, seatHeight: 790,
      forkOffset: 35, wheelRadius: 305, groundClearance: 180,
      dryWeight: 145, fuelCapacity: 12, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 35, engineX: 610, engineY: 340,
      frameWeight: 10, frameX: 720, frameY: 500,
      fuelTankWeight: 0, fuelTankX: 640, fuelTankY: 560,
      batteryWeight: 4, batteryX: 510, batteryY: 310,
      exhaustWeight: 6, exhaustX: 920, exhaustY: 350,
      swingarmWeight: 5, swingarmX: 1080, swingarmY: 350,
      riderX: 690, riderY: 750, pillionX: 880, pillionY: 700,
      luggageX: 980, luggageY: 650,
      frontBrakeForce: 0.8, rearBrakeForce: 0.5,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  scooter: {
    name: "Scooter (ICE)",
    icon: "🛵",
    color: "#00B4D8",
    desc: "Step-through, low CoG, urban agility",
    defaults: {
      wheelbase: 1300, rakeAngle: 27, trail: 85, seatHeight: 750,
      forkOffset: 30, wheelRadius: 255, groundClearance: 165,
      dryWeight: 110, fuelCapacity: 6, fuelLevel: 100,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 22, engineX: 900, engineY: 280,
      frameWeight: 8, frameX: 650, frameY: 420,
      fuelTankWeight: 0, fuelTankX: 600, fuelTankY: 400,
      batteryWeight: 3, batteryX: 550, batteryY: 280,
      exhaustWeight: 5, exhaustX: 1000, exhaustY: 300,
      swingarmWeight: 12, swingarmX: 1000, swingarmY: 300,
      riderX: 630, riderY: 700, pillionX: 820, pillionY: 660,
      luggageX: 900, luggageY: 600,
      frontBrakeForce: 0.7, rearBrakeForce: 0.45,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: false, evBatteryWeight: 0, evBatteryX: 0, evBatteryY: 0,
      evMotorWeight: 0, evMotorX: 0, evMotorY: 0,
    },
  },
  evScooter: {
    name: "EV Scooter",
    icon: "⚡",
    color: "#06D6A0",
    desc: "Electric, floor battery, low CoG advantage",
    defaults: {
      wheelbase: 1320, rakeAngle: 26, trail: 88, seatHeight: 760,
      forkOffset: 28, wheelRadius: 260, groundClearance: 170,
      dryWeight: 95, fuelCapacity: 0, fuelLevel: 0,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 0, engineX: 0, engineY: 0,
      frameWeight: 8, frameX: 660, frameY: 430,
      fuelTankWeight: 0, fuelTankX: 0, fuelTankY: 0,
      batteryWeight: 3, batteryX: 560, batteryY: 290,
      exhaustWeight: 0, exhaustX: 0, exhaustY: 0,
      swingarmWeight: 4, swingarmX: 1000, swingarmY: 310,
      riderX: 640, riderY: 710, pillionX: 830, pillionY: 670,
      luggageX: 920, luggageY: 610,
      frontBrakeForce: 0.75, rearBrakeForce: 0.5,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: true, evBatteryWeight: 30, evBatteryX: 620, evBatteryY: 260,
      evMotorWeight: 12, evMotorX: 1020, evMotorY: 290,
    },
  },
  evMotorcycle: {
    name: "EV Motorcycle",
    icon: "⚡",
    color: "#118AB2",
    desc: "Electric drivetrain, structural battery pack",
    defaults: {
      wheelbase: 1460, rakeAngle: 25, trail: 95, seatHeight: 810,
      forkOffset: 32, wheelRadius: 315, groundClearance: 175,
      dryWeight: 170, fuelCapacity: 0, fuelLevel: 0,
      riderWeight: 75, pillionWeight: 0, luggageWeight: 0,
      engineWeight: 0, engineX: 0, engineY: 0,
      frameWeight: 14, frameX: 730, frameY: 510,
      fuelTankWeight: 0, fuelTankX: 0, fuelTankY: 0,
      batteryWeight: 4, batteryX: 530, batteryY: 320,
      exhaustWeight: 0, exhaustX: 0, exhaustY: 0,
      swingarmWeight: 7, swingarmX: 1100, swingarmY: 360,
      riderX: 700, riderY: 770, pillionX: 900, pillionY: 720,
      luggageX: 1000, luggageY: 660,
      frontBrakeForce: 0.9, rearBrakeForce: 0.55,
      speed: 0, cornerRadius: 50, bankAngle: 0,
      evBattery: true, evBatteryWeight: 55, evBatteryX: 650, evBatteryY: 300,
      evMotorWeight: 22, evMotorX: 1050, evMotorY: 340,
    },
  },
};

const g = 9.81;

function computeCoG(p) {
  const fuelDensity = 0.745;
  const fuelWeight = p.fuelCapacity * (p.fuelLevel / 100) * fuelDensity;
  
  const masses = [];
  const addMass = (m, x, y, label) => {
    if (m > 0 && x > 0 && y > 0) masses.push({ m, x, y, label });
  };

  addMass(p.engineWeight, p.engineX, p.engineY, "Engine/Motor");
  addMass(p.frameWeight, p.frameX, p.frameY, "Frame");
  addMass(fuelWeight, p.fuelTankX || p.frameX, p.fuelTankY || (p.frameY + 60), "Fuel");
  addMass(p.batteryWeight, p.batteryX, p.batteryY, "12V Battery");
  addMass(p.exhaustWeight, p.exhaustX, p.exhaustY, "Exhaust");
  addMass(p.swingarmWeight, p.swingarmX, p.swingarmY, "Swingarm+Wheel");
  
  if (p.evBattery) {
    addMass(p.evBatteryWeight, p.evBatteryX, p.evBatteryY, "EV Battery Pack");
    addMass(p.evMotorWeight, p.evMotorX, p.evMotorY, "EV Motor");
  }

  const otherComponentWeight = p.dryWeight - masses.reduce((s, c) => s + c.m, 0);
  if (otherComponentWeight > 0) {
    addMass(otherComponentWeight, p.wheelbase * 0.48, p.seatHeight * 0.55, "Other Components");
  }

  addMass(p.riderWeight, p.riderX, p.riderY, "Rider");
  addMass(p.pillionWeight, p.pillionX, p.pillionY, "Pillion");
  addMass(p.luggageWeight, p.luggageX, p.luggageY, "Luggage");

  const totalMass = masses.reduce((s, c) => s + c.m, 0);
  const xcg = masses.reduce((s, c) => s + c.m * c.x, 0) / totalMass;
  const ycg = masses.reduce((s, c) => s + c.m * c.y, 0) / totalMass;

  const totalWeight = totalMass * g;
  const rFront = totalWeight * (p.wheelbase - xcg) / p.wheelbase;
  const rRear = totalWeight * xcg / p.wheelbase;
  const frontPct = ((p.wheelbase - xcg) / p.wheelbase) * 100;
  const rearPct = (xcg / p.wheelbase) * 100;

  const rakeRad = (p.rakeAngle * Math.PI) / 180;
  const trailCalc = (p.wheelRadius * Math.cos(rakeRad)) / Math.sin(rakeRad) - p.forkOffset;

  const speedMs = p.speed / 3.6;
  let deltaWbrake = 0, deltaWaccel = 0, deltaWlateral = 0;
  let frontPctBrake = frontPct, rearPctBrake = rearPct;
  let frontPctAccel = frontPct, rearPctAccel = rearPct;

  if (speedMs > 0) {
    const brakeDecel = p.frontBrakeForce * g;
    deltaWbrake = (totalMass * brakeDecel * (ycg / 1000)) / (p.wheelbase / 1000);
    frontPctBrake = ((rFront + deltaWbrake) / totalWeight) * 100;
    rearPctBrake = 100 - frontPctBrake;

    const accel = 0.4 * g;
    deltaWaccel = (totalMass * accel * (ycg / 1000)) / (p.wheelbase / 1000);
    frontPctAccel = ((rFront - deltaWaccel) / totalWeight) * 100;
    rearPctAccel = 100 - frontPctAccel;

    if (p.cornerRadius > 0) {
      const aLat = (speedMs * speedMs) / p.cornerRadius;
      deltaWlateral = totalMass * aLat * (ycg / 1000);
    }
  }

  const bankAngleCalc = speedMs > 0 && p.cornerRadius > 0
    ? Math.atan((speedMs * speedMs) / (p.cornerRadius * g)) * (180 / Math.PI)
    : 0;

  return {
    masses, totalMass, totalWeight,
    xcg, ycg,
    rFront, rRear, frontPct, rearPct,
    trailCalc,
    deltaWbrake, deltaWaccel, deltaWlateral,
    frontPctBrake, rearPctBrake,
    frontPctAccel, rearPctAccel,
    bankAngleCalc,
    cogHeightRatio: ycg / p.wheelbase,
  };
}

/* ─── SVG BIKE RENDERER ─────────────────────────────────────────────── */
function BikeVisualization({ params, result, family, scale = 0.38, showLabels = true }) {
  const fam = BIKE_FAMILIES[family];
  const col = fam.color;
  const wb = params.wheelbase;
  const sh = params.seatHeight;
  const gc = params.groundClearance;
  const wr = params.wheelRadius;
  const rakeRad = (params.rakeAngle * Math.PI) / 180;

  const ox = 80, oy = 420;
  const s = scale;
  const tx = (x) => ox + x * s;
  const ty = (y) => oy - y * s;

  const frontAxleX = tx(0);
  const frontAxleY = ty(wr);
  const rearAxleX = tx(wb);
  const rearAxleY = ty(wr);
  const groundY = ty(0);

  const steeringHeadX = tx(wr * Math.sin(rakeRad) * 0.3);
  const steeringHeadY = ty(sh * 0.85);
  
  const seatX = tx(wb * 0.42);
  const seatY = ty(sh);
  const rearSeatX = tx(wb * 0.58);
  const rearSeatY = ty(sh * 0.92);
  const tailX = tx(wb * 0.75);
  const tailY = ty(sh * 0.6);

  const swingPivotX = tx(wb * 0.55);
  const swingPivotY = ty(wr * 1.3);

  const cogX = tx(result.xcg);
  const cogY = ty(result.ycg);

  const isScooter = family === "scooter" || family === "evScooter";
  const isEV = family === "evScooter" || family === "evMotorcycle";

  return (
    <svg viewBox="0 0 700 480" style={{ width: "100%", height: "auto", background: "transparent" }}>
      <defs>
        <radialGradient id={`wg-${family}`} cx="40%" cy="40%">
          <stop offset="0%" stopColor="#555" />
          <stop offset="100%" stopColor="#222" />
        </radialGradient>
        <filter id="cogGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id={`frame-${family}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={col} stopOpacity="0.9" />
          <stop offset="100%" stopColor={col} stopOpacity="0.5" />
        </linearGradient>
        <marker id="arrowR" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#E63946" />
        </marker>
        <marker id="arrowG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#06D6A0" />
        </marker>
      </defs>

      {/* Ground line */}
      <line x1="20" y1={groundY} x2="680" y2={groundY} stroke="#444" strokeWidth="1.5" strokeDasharray="6,4" />
      <text x="15" y={groundY + 14} fill="#666" fontSize="9" fontFamily="monospace">Ground</text>

      {/* Wheels */}
      {[{ cx: frontAxleX, cy: frontAxleY, label: "Front" }, { cx: rearAxleX, cy: rearAxleY, label: "Rear" }].map((w, i) => (
        <g key={i}>
          <circle cx={w.cx} cy={w.cy} r={wr * s} fill="none" stroke="#555" strokeWidth="3" />
          <circle cx={w.cx} cy={w.cy} r={wr * s - 4} fill="none" stroke="#333" strokeWidth="1.5" />
          <circle cx={w.cx} cy={w.cy} r={3} fill={col} />
          {showLabels && <text x={w.cx} y={groundY + 14} textAnchor="middle" fill="#888" fontSize="8" fontFamily="monospace">{w.label}</text>}
        </g>
      ))}

      {/* Fork */}
      <line x1={frontAxleX} y1={frontAxleY} x2={steeringHeadX + 12} y2={steeringHeadY + 10} stroke="#666" strokeWidth="3" strokeLinecap="round" />
      <line x1={frontAxleX + 4} y1={frontAxleY} x2={steeringHeadX + 16} y2={steeringHeadY + 10} stroke="#555" strokeWidth="2" strokeLinecap="round" />

      {/* Main frame body */}
      <path
        d={isScooter
          ? `M${steeringHeadX + 12},${steeringHeadY + 10} Q${tx(wb * 0.25)},${ty(sh * 0.5)} ${tx(wb * 0.3)},${ty(gc + 40)} L${tx(wb * 0.55)},${ty(gc + 30)} Q${tx(wb * 0.65)},${ty(sh * 0.45)} ${rearSeatX},${rearSeatY}`
          : `M${steeringHeadX + 12},${steeringHeadY + 10} C${seatX - 20},${seatY - 15} ${seatX},${seatY} ${seatX + 10},${seatY + 5} L${rearSeatX},${rearSeatY} L${tailX},${tailY}`
        }
        fill="none" stroke={col} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Top frame tube */}
      {!isScooter && (
        <path
          d={`M${steeringHeadX + 14},${steeringHeadY + 5} Q${tx(wb * 0.28)},${ty(sh * 1.02)} ${seatX},${seatY}`}
          fill="none" stroke={col} strokeWidth="3" strokeLinecap="round" opacity="0.7"
        />
      )}

      {/* Engine/Motor block */}
      {!isEV && params.engineWeight > 0 && (
        <g>
          <rect x={tx(params.engineX) - 22} y={ty(params.engineY) - 18} width="44" height="36" rx="4" fill="#333" stroke="#555" strokeWidth="1.5" opacity="0.85" />
          {showLabels && <text x={tx(params.engineX)} y={ty(params.engineY) + 3} textAnchor="middle" fill="#aaa" fontSize="7" fontFamily="monospace">ENG</text>}
        </g>
      )}

      {/* EV Battery Pack */}
      {isEV && params.evBatteryWeight > 0 && (
        <g>
          <rect x={tx(params.evBatteryX) - 30} y={ty(params.evBatteryY) - 14} width="60" height="28" rx="3" fill="#1a472a" stroke="#06D6A0" strokeWidth="1.5" opacity="0.9" />
          {showLabels && <text x={tx(params.evBatteryX)} y={ty(params.evBatteryY) + 3} textAnchor="middle" fill="#06D6A0" fontSize="7" fontFamily="monospace" fontWeight="bold">BATTERY</text>}
        </g>
      )}

      {/* EV Motor */}
      {isEV && params.evMotorWeight > 0 && (
        <g>
          <circle cx={tx(params.evMotorX)} cy={ty(params.evMotorY)} r="14" fill="#1a3a4a" stroke="#118AB2" strokeWidth="1.5" />
          {showLabels && <text x={tx(params.evMotorX)} y={ty(params.evMotorY) + 3} textAnchor="middle" fill="#118AB2" fontSize="7" fontFamily="monospace">MOT</text>}
        </g>
      )}

      {/* Swingarm */}
      <line x1={swingPivotX} y1={swingPivotY} x2={rearAxleX} y2={rearAxleY} stroke="#555" strokeWidth="3" strokeLinecap="round" />

      {/* Exhaust */}
      {params.exhaustWeight > 0 && (
        <ellipse cx={tx(params.exhaustX)} cy={ty(params.exhaustY)} rx="18" ry="8" fill="#444" stroke="#666" strokeWidth="1" opacity="0.7" />
      )}

      {/* Seat */}
      <path
        d={`M${seatX - 10},${seatY + 2} Q${(seatX + rearSeatX) / 2},${seatY - 8} ${rearSeatX + 5},${rearSeatY + 2}`}
        fill="none" stroke={col} strokeWidth="5" strokeLinecap="round" opacity="0.6"
      />

      {/* Handlebar */}
      <line x1={steeringHeadX} y1={steeringHeadY - 2} x2={steeringHeadX + 25} y2={steeringHeadY - 12} stroke="#777" strokeWidth="3" strokeLinecap="round" />

      {/* ════ CoG MARKER ════ */}
      <g filter="url(#cogGlow)">
        <circle cx={cogX} cy={cogY} r="10" fill={col} fillOpacity="0.25" stroke={col} strokeWidth="2" />
        <circle cx={cogX} cy={cogY} r="4" fill={col} />
        <line x1={cogX - 14} y1={cogY} x2={cogX + 14} y2={cogY} stroke={col} strokeWidth="1.5" />
        <line x1={cogX} y1={cogY - 14} x2={cogX} y2={cogY + 14} stroke={col} strokeWidth="1.5" />
      </g>
      {showLabels && (
        <g>
          <rect x={cogX + 14} y={cogY - 20} width="60" height="22" rx="3" fill="#111" fillOpacity="0.9" stroke={col} strokeWidth="1" />
          <text x={cogX + 44} y={cogY - 5} textAnchor="middle" fill={col} fontSize="9" fontFamily="monospace" fontWeight="bold">CoG</text>
        </g>
      )}

      {/* CoG Height reference line */}
      <line x1={cogX} y1={cogY} x2={cogX} y2={groundY} stroke={col} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
      {showLabels && (
        <text x={cogX + 8} y={(cogY + groundY) / 2} fill={col} fontSize="8" fontFamily="monospace" opacity="0.7">{result.ycg.toFixed(0)} mm</text>
      )}

      {/* CoG X position from front axle */}
      {showLabels && (
        <>
          <line x1={frontAxleX} y1={groundY + 22} x2={cogX} y2={groundY + 22} stroke={col} strokeWidth="1" markerEnd="url(#arrowG)" opacity="0.6" />
          <text x={(frontAxleX + cogX) / 2} y={groundY + 34} textAnchor="middle" fill={col} fontSize="8" fontFamily="monospace">{result.xcg.toFixed(0)} mm from front</text>
        </>
      )}

      {/* Wheelbase dimension */}
      {showLabels && (
        <>
          <line x1={frontAxleX} y1={groundY + 46} x2={rearAxleX} y2={groundY + 46} stroke="#666" strokeWidth="0.8" />
          <text x={(frontAxleX + rearAxleX) / 2} y={groundY + 58} textAnchor="middle" fill="#888" fontSize="8" fontFamily="monospace">WB: {wb} mm</text>
        </>
      )}

      {/* Mass contribution dots */}
      {showLabels && result.masses.filter(m => m.m > 3).map((m, i) => (
        <g key={i} opacity="0.5">
          <circle cx={tx(m.x)} cy={ty(m.y)} r={Math.max(2, Math.min(6, m.m / 8))} fill={col} fillOpacity="0.4" />
        </g>
      ))}

      {/* Title */}
      <text x="20" y="22" fill={col} fontSize="13" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">{fam.icon} {fam.name}</text>
      <text x="20" y="38" fill="#888" fontSize="9" fontFamily="monospace">{fam.desc}</text>
    </svg>
  );
}

/* ─── INPUT FIELD COMPONENT ────────────────────────────────────────── */
function Field({ label, unit, value, onChange, min, max, step = 1, tip }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
        <label style={{ fontSize: "11px", color: "#b0b8c4", fontFamily: "monospace" }}>{label}</label>
        <span style={{ fontSize: "10px", color: "#666", fontFamily: "monospace" }}>{unit}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: "var(--accent, #06D6A0)", height: "4px" }}
        />
        <input
          type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: "64px", background: "#1a1d23", border: "1px solid #333", borderRadius: "4px",
            color: "#e0e6ed", padding: "4px 6px", fontSize: "11px", fontFamily: "monospace", textAlign: "right",
          }}
        />
      </div>
      {tip && <div style={{ fontSize: "9px", color: "#556", marginTop: "2px", fontStyle: "italic" }}>{tip}</div>}
    </div>
  );
}

/* ─── RESULT CARD ──────────────────────────────────────────────────── */
function ResultCard({ label, value, unit, color = "#06D6A0", small }) {
  return (
    <div style={{
      background: "#12151a", borderRadius: "8px", padding: small ? "8px 10px" : "12px 14px",
      border: `1px solid ${color}22`, minWidth: small ? "100px" : "130px", flex: "1 1 auto",
    }}>
      <div style={{ fontSize: "9px", color: "#667", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: small ? "16px" : "22px", fontWeight: "bold", color, fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
        {typeof value === "number" ? value.toFixed(1) : value}
        <span style={{ fontSize: "10px", color: "#556", marginLeft: "3px" }}>{unit}</span>
      </div>
    </div>
  );
}

/* ─── COMPARISON TABLE ─────────────────────────────────────────────── */
function ComparisonView({ saved }) {
  if (saved.length < 2) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#556", fontFamily: "monospace", fontSize: "13px" }}>
      Save at least 2 configurations to compare. Use the "Save Configuration" button after calculating.
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: "11px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333" }}>
            <th style={{ padding: "8px", textAlign: "left", color: "#888" }}>Parameter</th>
            {saved.map((s, i) => (
              <th key={i} style={{ padding: "8px", textAlign: "center", color: BIKE_FAMILIES[s.family].color, minWidth: "110px" }}>
                {BIKE_FAMILIES[s.family].icon} {s.name || BIKE_FAMILIES[s.family].name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Total Mass", (s) => `${s.result.totalMass.toFixed(1)} kg`],
            ["CoG X (from front)", (s) => `${s.result.xcg.toFixed(1)} mm`],
            ["CoG Y (height)", (s) => `${s.result.ycg.toFixed(1)} mm`],
            ["Front Load %", (s) => `${s.result.frontPct.toFixed(1)}%`],
            ["Rear Load %", (s) => `${s.result.rearPct.toFixed(1)}%`],
            ["Front Reaction", (s) => `${s.result.rFront.toFixed(0)} N`],
            ["Rear Reaction", (s) => `${s.result.rRear.toFixed(0)} N`],
            ["Trail (calc)", (s) => `${s.result.trailCalc.toFixed(1)} mm`],
            ["CoG Ht / WB ratio", (s) => s.result.cogHeightRatio.toFixed(3)],
            ["Wheelbase", (s) => `${s.params.wheelbase} mm`],
            ["Rake", (s) => `${s.params.rakeAngle}°`],
            ["Seat Height", (s) => `${s.params.seatHeight} mm`],
          ].map(([label, fn], ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #1e2128", background: ri % 2 === 0 ? "#0d0f13" : "transparent" }}>
              <td style={{ padding: "6px 8px", color: "#aab" }}>{label}</td>
              {saved.map((s, ci) => (
                <td key={ci} style={{ padding: "6px 8px", textAlign: "center", color: "#dde" }}>{fn(s)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── WEIGHT DISTRIBUTION BAR ─────────────────────────────────────── */
function WeightBar({ frontPct, rearPct, label, colorF = "#E63946", colorR = "#457B9D" }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      {label && <div style={{ fontSize: "9px", color: "#667", fontFamily: "monospace", marginBottom: "4px", textTransform: "uppercase" }}>{label}</div>}
      <div style={{ display: "flex", height: "24px", borderRadius: "4px", overflow: "hidden", border: "1px solid #333" }}>
        <div style={{ width: `${frontPct}%`, background: colorF, display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.4s ease" }}>
          <span style={{ fontSize: "10px", fontWeight: "bold", color: "#fff", fontFamily: "monospace" }}>F {frontPct.toFixed(1)}%</span>
        </div>
        <div style={{ width: `${rearPct}%`, background: colorR, display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.4s ease" }}>
          <span style={{ fontSize: "10px", fontWeight: "bold", color: "#fff", fontFamily: "monospace" }}>R {rearPct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

/* ─── MASS BREAKDOWN TABLE ─────────────────────────────────────────── */
function MassBreakdown({ masses, totalMass, color }) {
  const sorted = [...masses].sort((a, b) => b.m - a.m);
  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ fontSize: "10px", color: "#888", fontFamily: "monospace", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Mass Contribution Breakdown</div>
      {sorted.map((m, i) => {
        const pct = (m.m / totalMass) * 100;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ width: "100px", fontSize: "10px", color: "#aab", fontFamily: "monospace", textAlign: "right" }}>{m.label}</span>
            <div style={{ flex: 1, height: "10px", background: "#1a1d23", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, opacity: 0.6, borderRadius: "2px", transition: "width 0.3s" }} />
            </div>
            <span style={{ width: "55px", fontSize: "10px", color: "#888", fontFamily: "monospace" }}>{m.m.toFixed(1)} kg</span>
            <span style={{ width: "35px", fontSize: "9px", color: "#556", fontFamily: "monospace" }}>{pct.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [family, setFamily] = useState("sport");
  const [params, setParams] = useState({ ...BIKE_FAMILIES.sport.defaults });
  const [saved, setSaved] = useState([]);
  const [tab, setTab] = useState("calc");
  const [section, setSection] = useState("geometry");
  const [saveName, setSaveName] = useState("");
  const exportRef = useRef(null);

  const fam = BIKE_FAMILIES[family];
  const result = computeCoG(params);

  const setP = useCallback((key, val) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  }, []);

  const selectFamily = useCallback((f) => {
    setFamily(f);
    setParams({ ...BIKE_FAMILIES[f].defaults });
  }, []);

  const saveConfig = useCallback(() => {
    setSaved((prev) => [...prev, {
      family, params: { ...params }, result: { ...result },
      name: saveName || `${fam.name} #${prev.filter(s => s.family === family).length + 1}`,
      timestamp: new Date().toISOString(),
    }]);
    setSaveName("");
  }, [family, params, result, saveName, fam.name]);

  const exportSVG = useCallback(() => {
    const svgEl = exportRef.current?.querySelector("svg");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // Add dark background for export
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#0a0c10");
    clone.insertBefore(bg, clone.firstChild);
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CoG_${fam.name.replace(/[/ ]/g, "_")}_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fam.name]);

  const exportPNG = useCallback(() => {
    const svgEl = exportRef.current?.querySelector("svg");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "700");
    bg.setAttribute("height", "480");
    bg.setAttribute("fill", "#0a0c10");
    clone.insertBefore(bg, clone.firstChild);
    const data = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2100;
      canvas.height = 1440;
      const ctx = canvas.getContext("2d");
      ctx.scale(3, 3);
      ctx.drawImage(img, 0, 0, 700, 480);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CoG_${fam.name.replace(/[/ ]/g, "_")}_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  }, [fam.name]);

  const isEV = family === "evScooter" || family === "evMotorcycle";

  const sectionInputs = {
    geometry: (
      <>
        <Field label="Wheelbase" unit="mm" value={params.wheelbase} onChange={(v) => setP("wheelbase", v)} min={1000} max={2000} />
        <Field label="Rake Angle" unit="deg" value={params.rakeAngle} onChange={(v) => setP("rakeAngle", v)} min={18} max={40} step={0.5} />
        <Field label="Trail" unit="mm" value={params.trail} onChange={(v) => setP("trail", v)} min={50} max={180} />
        <Field label="Fork Offset" unit="mm" value={params.forkOffset} onChange={(v) => setP("forkOffset", v)} min={15} max={60} />
        <Field label="Seat Height" unit="mm" value={params.seatHeight} onChange={(v) => setP("seatHeight", v)} min={650} max={1000} />
        <Field label="Wheel Radius" unit="mm" value={params.wheelRadius} onChange={(v) => setP("wheelRadius", v)} min={200} max={400} />
        <Field label="Ground Clearance" unit="mm" value={params.groundClearance} onChange={(v) => setP("groundClearance", v)} min={100} max={400} />
      </>
    ),
    weights: (
      <>
        <Field label="Dry Weight (total bike)" unit="kg" value={params.dryWeight} onChange={(v) => setP("dryWeight", v)} min={50} max={500} />
        <Field label="Fuel Capacity" unit="L" value={params.fuelCapacity} onChange={(v) => setP("fuelCapacity", v)} min={0} max={35} />
        <Field label="Fuel Level" unit="%" value={params.fuelLevel} onChange={(v) => setP("fuelLevel", v)} min={0} max={100} />
        <Field label="Rider Weight" unit="kg" value={params.riderWeight} onChange={(v) => setP("riderWeight", v)} min={40} max={150} />
        <Field label="Pillion Weight" unit="kg" value={params.pillionWeight} onChange={(v) => setP("pillionWeight", v)} min={0} max={120} />
        <Field label="Luggage Weight" unit="kg" value={params.luggageWeight} onChange={(v) => setP("luggageWeight", v)} min={0} max={80} />
      </>
    ),
    components: (
      <>
        {!isEV && <Field label="Engine Weight" unit="kg" value={params.engineWeight} onChange={(v) => setP("engineWeight", v)} min={0} max={120} />}
        {!isEV && <Field label="Engine X Position" unit="mm" value={params.engineX} onChange={(v) => setP("engineX", v)} min={200} max={1200} tip="Distance from front axle" />}
        {!isEV && <Field label="Engine Y Position" unit="mm" value={params.engineY} onChange={(v) => setP("engineY", v)} min={150} max={700} tip="Height from ground" />}
        <Field label="Frame Weight" unit="kg" value={params.frameWeight} onChange={(v) => setP("frameWeight", v)} min={4} max={40} />
        <Field label="Frame X" unit="mm" value={params.frameX} onChange={(v) => setP("frameX", v)} min={200} max={1400} />
        <Field label="Frame Y" unit="mm" value={params.frameY} onChange={(v) => setP("frameY", v)} min={200} max={800} />
        {!isEV && <Field label="Exhaust Weight" unit="kg" value={params.exhaustWeight} onChange={(v) => setP("exhaustWeight", v)} min={0} max={25} />}
        {!isEV && <Field label="Exhaust X" unit="mm" value={params.exhaustX} onChange={(v) => setP("exhaustX", v)} min={400} max={1400} />}
        {!isEV && <Field label="Exhaust Y" unit="mm" value={params.exhaustY} onChange={(v) => setP("exhaustY", v)} min={150} max={600} />}
        <Field label="Swingarm + Rear Wheel" unit="kg" value={params.swingarmWeight} onChange={(v) => setP("swingarmWeight", v)} min={2} max={30} />
        <Field label="Swingarm X" unit="mm" value={params.swingarmX} onChange={(v) => setP("swingarmX", v)} min={600} max={1600} />
        <Field label="Swingarm Y" unit="mm" value={params.swingarmY} onChange={(v) => setP("swingarmY", v)} min={150} max={500} />
        <Field label="12V Battery Weight" unit="kg" value={params.batteryWeight} onChange={(v) => setP("batteryWeight", v)} min={0} max={10} />
        <Field label="12V Battery X" unit="mm" value={params.batteryX} onChange={(v) => setP("batteryX", v)} min={200} max={1200} />
        <Field label="12V Battery Y" unit="mm" value={params.batteryY} onChange={(v) => setP("batteryY", v)} min={150} max={600} />
      </>
    ),
    ev: isEV ? (
      <>
        <Field label="EV Battery Pack Weight" unit="kg" value={params.evBatteryWeight} onChange={(v) => setP("evBatteryWeight", v)} min={5} max={120} />
        <Field label="Battery Pack X" unit="mm" value={params.evBatteryX} onChange={(v) => setP("evBatteryX", v)} min={200} max={1200} tip="Distance from front axle" />
        <Field label="Battery Pack Y" unit="mm" value={params.evBatteryY} onChange={(v) => setP("evBatteryY", v)} min={100} max={600} tip="Height from ground — lower is better for CoG" />
        <Field label="EV Motor Weight" unit="kg" value={params.evMotorWeight} onChange={(v) => setP("evMotorWeight", v)} min={3} max={50} />
        <Field label="Motor X" unit="mm" value={params.evMotorX} onChange={(v) => setP("evMotorX", v)} min={400} max={1400} />
        <Field label="Motor Y" unit="mm" value={params.evMotorY} onChange={(v) => setP("evMotorY", v)} min={150} max={500} />
      </>
    ) : (
      <div style={{ padding: "20px", color: "#556", fontFamily: "monospace", fontSize: "12px", textAlign: "center" }}>
        EV parameters only available for EV Scooter and EV Motorcycle families.
      </div>
    ),
    rider: (
      <>
        <Field label="Rider X Position" unit="mm" value={params.riderX} onChange={(v) => setP("riderX", v)} min={300} max={1200} tip="Rider CoG from front axle" />
        <Field label="Rider Y Position" unit="mm" value={params.riderY} onChange={(v) => setP("riderY", v)} min={400} max={1100} tip="Rider CoG height from ground" />
        <Field label="Pillion X Position" unit="mm" value={params.pillionX} onChange={(v) => setP("pillionX", v)} min={500} max={1400} />
        <Field label="Pillion Y Position" unit="mm" value={params.pillionY} onChange={(v) => setP("pillionY", v)} min={400} max={1000} />
        <Field label="Luggage X Position" unit="mm" value={params.luggageX} onChange={(v) => setP("luggageX", v)} min={600} max={1500} />
        <Field label="Luggage Y Position" unit="mm" value={params.luggageY} onChange={(v) => setP("luggageY", v)} min={300} max={900} />
      </>
    ),
    dynamics: (
      <>
        <Field label="Speed" unit="km/h" value={params.speed} onChange={(v) => setP("speed", v)} min={0} max={300} tip="For dynamic load transfer calculations" />
        <Field label="Front Brake Force" unit="g" value={params.frontBrakeForce} onChange={(v) => setP("frontBrakeForce", v)} min={0} max={1.5} step={0.05} />
        <Field label="Rear Brake Force" unit="g" value={params.rearBrakeForce} onChange={(v) => setP("rearBrakeForce", v)} min={0} max={1} step={0.05} />
        <Field label="Corner Radius" unit="m" value={params.cornerRadius} onChange={(v) => setP("cornerRadius", v)} min={5} max={500} />
      </>
    ),
  };

  const sectionLabels = { geometry: "Geometry", weights: "Weights", components: "Components", ev: "EV Drive", rider: "Rider Position", dynamics: "Dynamics" };

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      background: "#0a0c10", color: "#e0e6ed", minHeight: "100vh", padding: "0",
    }}>
      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)",
        borderBottom: "1px solid #21262d",
        padding: "20px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px", color: "#e6edf3" }}>
              <span style={{ color: "#06D6A0" }}>◎</span> Motorcycle CoG Calculator
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8b949e", letterSpacing: "0.3px" }}>
              Centre of Gravity Analysis — All Two-Wheeler Families — Physics-Based Computation
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {["calc", "compare"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  background: tab === t ? "#06D6A0" : "transparent",
                  color: tab === t ? "#0a0c10" : "#8b949e",
                  border: `1px solid ${tab === t ? "#06D6A0" : "#30363d"}`,
                  borderRadius: "6px", padding: "6px 16px", fontSize: "11px",
                  fontFamily: "inherit", cursor: "pointer", fontWeight: tab === t ? "700" : "400",
                  textTransform: "uppercase", letterSpacing: "1px", transition: "all 0.2s",
                }}>
                {t === "calc" ? "Calculator" : `Compare (${saved.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "calc" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0" }}>
          {/* ── LEFT: FAMILY SELECTOR + INPUTS ── */}
          <div style={{
            width: "320px", minWidth: "280px", background: "#0d1117",
            borderRight: "1px solid #21262d", maxHeight: "calc(100vh - 80px)", overflowY: "auto",
          }}>
            {/* Family selector */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #21262d" }}>
              <div style={{ fontSize: "9px", color: "#8b949e", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1.5px" }}>Vehicle Family</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                {Object.entries(BIKE_FAMILIES).map(([key, f]) => (
                  <button key={key} onClick={() => selectFamily(key)}
                    style={{
                      background: family === key ? `${f.color}18` : "#161b22",
                      border: `1px solid ${family === key ? f.color : "#21262d"}`,
                      borderRadius: "5px", padding: "6px 8px", cursor: "pointer",
                      textAlign: "left", transition: "all 0.15s",
                    }}>
                    <div style={{ fontSize: "12px" }}>{f.icon}</div>
                    <div style={{ fontSize: "9px", color: family === key ? f.color : "#8b949e", fontFamily: "monospace", lineHeight: "1.3" }}>{f.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", padding: "8px 14px", borderBottom: "1px solid #21262d" }}>
              {Object.entries(sectionLabels).map(([key, label]) => (
                <button key={key} onClick={() => setSection(key)}
                  style={{
                    background: section === key ? fam.color : "transparent",
                    color: section === key ? "#0a0c10" : "#8b949e",
                    border: "none", borderRadius: "4px", padding: "4px 8px",
                    fontSize: "9px", fontFamily: "inherit", cursor: "pointer",
                    fontWeight: section === key ? "700" : "400",
                    letterSpacing: "0.3px", transition: "all 0.15s",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div style={{ padding: "14px" }}>
              {sectionInputs[section]}
            </div>
          </div>

          {/* ── RIGHT: VISUALIZATION + RESULTS ── */}
          <div style={{ flex: 1, minWidth: "400px", maxHeight: "calc(100vh - 80px)", overflowY: "auto", padding: "16px 20px" }}>
            {/* Bike visualization */}
            <div ref={exportRef} style={{
              background: "#0d1117", borderRadius: "12px", border: "1px solid #21262d",
              padding: "12px", marginBottom: "16px",
            }}>
              <BikeVisualization params={params} result={result} family={family} />
            </div>

            {/* Result cards */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
              <ResultCard label="CoG X (from front)" value={result.xcg} unit="mm" color={fam.color} />
              <ResultCard label="CoG Height" value={result.ycg} unit="mm" color={fam.color} />
              <ResultCard label="Total Mass" value={result.totalMass} unit="kg" color="#8b949e" />
              <ResultCard label="Trail (calc)" value={result.trailCalc} unit="mm" color="#E9C46A" />
              <ResultCard label="CoG Ht / WB" value={result.cogHeightRatio} unit="" color="#E9C46A" small />
            </div>

            {/* Weight distribution */}
            <div style={{
              background: "#0d1117", borderRadius: "10px", border: "1px solid #21262d",
              padding: "14px", marginBottom: "16px",
            }}>
              <div style={{ fontSize: "10px", color: "#8b949e", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Weight Distribution</div>
              <WeightBar frontPct={result.frontPct} rearPct={result.rearPct} label="Static" />
              {params.speed > 0 && (
                <>
                  <WeightBar frontPct={result.frontPctBrake} rearPct={result.rearPctBrake} label={`Hard Braking (${params.frontBrakeForce}g decel)`} colorF="#ff6b6b" colorR="#4ecdc4" />
                  <WeightBar frontPct={result.frontPctAccel} rearPct={result.rearPctAccel} label="Full Acceleration (0.4g)" colorF="#ffa07a" colorR="#20b2aa" />
                </>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                <ResultCard label="Front Axle" value={result.rFront} unit="N" color="#E63946" small />
                <ResultCard label="Rear Axle" value={result.rRear} unit="N" color="#457B9D" small />
                {params.speed > 0 && result.deltaWbrake > 0 && (
                  <ResultCard label="Brake ΔW Transfer" value={result.deltaWbrake} unit="N" color="#ff6b6b" small />
                )}
                {params.speed > 0 && result.deltaWlateral > 0 && (
                  <ResultCard label="Lateral Force" value={result.deltaWlateral} unit="N" color="#ffd166" small />
                )}
                {params.speed > 0 && result.bankAngleCalc > 0 && (
                  <ResultCard label="Bank Angle (calc)" value={result.bankAngleCalc} unit="°" color="#06D6A0" small />
                )}
              </div>
            </div>

            {/* Mass breakdown */}
            <div style={{
              background: "#0d1117", borderRadius: "10px", border: "1px solid #21262d",
              padding: "14px", marginBottom: "16px",
            }}>
              <MassBreakdown masses={result.masses} totalMass={result.totalMass} color={fam.color} />
            </div>

            {/* Formulae reference */}
            <div style={{
              background: "#0d1117", borderRadius: "10px", border: "1px solid #21262d",
              padding: "14px", marginBottom: "16px",
            }}>
              <div style={{ fontSize: "10px", color: "#8b949e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Governing Equations</div>
              {[
                ["CoG X", "X_cg = Σ(m_i · x_i) / Σ(m_i)"],
                ["CoG Y", "Y_cg = Σ(m_i · y_i) / Σ(m_i)"],
                ["Front Reaction", "R_front = W × (WB − X_cg) / WB"],
                ["Rear Reaction", "R_rear = W × X_cg / WB"],
                ["Load Transfer (Brake)", "ΔW = m·a·Y_cg / WB"],
                ["Trail", "T = R·cos(λ)/sin(λ) − f_offset"],
                ["Bank Angle", "θ = arctan(V² / (R·g))"],
                ["Lateral Load", "F_lat = m·V²/R · Y_cg / Track"],
              ].map(([label, eq], i) => (
                <div key={i} style={{ display: "flex", gap: "12px", padding: "4px 0", borderBottom: "1px solid #161b22" }}>
                  <span style={{ width: "140px", fontSize: "10px", color: "#8b949e", fontFamily: "monospace" }}>{label}</span>
                  <code style={{ fontSize: "10px", color: "#06D6A0", fontFamily: "monospace" }}>{eq}</code>
                </div>
              ))}
            </div>

            {/* Save + Export */}
            <div style={{
              background: "#0d1117", borderRadius: "10px", border: "1px solid #21262d",
              padding: "14px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center",
            }}>
              <input
                type="text" placeholder="Config name (optional)" value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                style={{
                  background: "#161b22", border: "1px solid #30363d", borderRadius: "6px",
                  color: "#e6edf3", padding: "8px 12px", fontSize: "11px", fontFamily: "inherit",
                  flex: "1 1 160px", minWidth: "140px",
                }}
              />
              <button onClick={saveConfig} style={{
                background: fam.color, color: "#0a0c10", border: "none", borderRadius: "6px",
                padding: "8px 16px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                fontFamily: "inherit", letterSpacing: "0.5px",
              }}>Save Config</button>
              <button onClick={exportSVG} style={{
                background: "transparent", color: "#8b949e", border: "1px solid #30363d", borderRadius: "6px",
                padding: "8px 14px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit",
              }}>Export SVG</button>
              <button onClick={exportPNG} style={{
                background: "transparent", color: "#8b949e", border: "1px solid #30363d", borderRadius: "6px",
                padding: "8px 14px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit",
              }}>Export PNG</button>
            </div>
          </div>
        </div>
      ) : (
        /* ── COMPARE TAB ── */
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            {saved.map((s, i) => (
              <div key={i} style={{
                background: "#0d1117", borderRadius: "10px", border: `1px solid ${BIKE_FAMILIES[s.family].color}33`,
                padding: "8px", width: "280px",
              }}>
                <BikeVisualization params={s.params} result={s.result} family={s.family} scale={0.28} showLabels={false} />
                <div style={{ padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: BIKE_FAMILIES[s.family].color, fontWeight: "700" }}>{s.name}</span>
                  <button onClick={() => setSaved(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "#E63946", cursor: "pointer", fontSize: "11px", fontFamily: "monospace" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            background: "#0d1117", borderRadius: "12px", border: "1px solid #21262d", padding: "16px",
          }}>
            <ComparisonView saved={saved} />
          </div>
        </div>
      )}
    </div>
  );
}
