/**
 * Stadium Graph Data Model
 * 
 * Models the Narendra Modi Stadium (Ahmedabad) as a graph.
 * - 18 seating blocks (A–R) arranged in an oval
 * - 4 main gates (Gate 1–4)
 * - Facilities: washrooms, food courts, medical, VIP lounge
 * - Nodes have positions for visualization (x, y on a 100x100 grid)
 */

// Helper: generate oval positions for seating blocks
function ovalPosition(index, total, rx = 40, ry = 35, cx = 50, cy = 50) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: Math.round(cx + rx * Math.cos(angle)),
    y: Math.round(cy + ry * Math.sin(angle)),
  };
}

const BLOCK_NAMES = 'ABCDEFGHIJKLMNOPQR'.split('');

// --- NODES ---
const seatingBlocks = BLOCK_NAMES.map((letter, i) => {
  const pos = ovalPosition(i, 18);
  return {
    id: `block_${letter}`,
    name: `Block ${letter}`,
    type: 'seating',
    tier: i < 9 ? 'lower' : 'upper',
    capacity: 7000 + Math.floor(Math.random() * 1500),
    position: pos,
  };
});

const gates = [
  { id: 'gate_1', name: 'Gate 1 (North)',  type: 'gate', position: { x: 50, y: 10 } },
  { id: 'gate_2', name: 'Gate 2 (East)',   type: 'gate', position: { x: 92, y: 50 } },
  { id: 'gate_3', name: 'Gate 3 (South)',  type: 'gate', position: { x: 50, y: 90 } },
  { id: 'gate_4', name: 'Gate 4 (West)',   type: 'gate', position: { x: 8,  y: 50 } },
];

const facilities = [
  { id: 'washroom_1', name: 'Washroom N1', type: 'washroom', position: { x: 40, y: 15 } },
  { id: 'washroom_2', name: 'Washroom E1', type: 'washroom', position: { x: 85, y: 40 } },
  { id: 'washroom_3', name: 'Washroom S1', type: 'washroom', position: { x: 60, y: 85 } },
  { id: 'washroom_4', name: 'Washroom W1', type: 'washroom', position: { x: 15, y: 60 } },
  { id: 'washroom_5', name: 'Washroom N2', type: 'washroom', position: { x: 60, y: 15 } },
  { id: 'washroom_6', name: 'Washroom S2', type: 'washroom', position: { x: 40, y: 85 } },
  { id: 'food_1',     name: 'Food Court North',  type: 'food', position: { x: 45, y: 20 } },
  { id: 'food_2',     name: 'Food Court East',   type: 'food', position: { x: 80, y: 55 } },
  { id: 'food_3',     name: 'Food Court South',  type: 'food', position: { x: 45, y: 80 } },
  { id: 'food_4',     name: 'Food Court West',   type: 'food', position: { x: 20, y: 45 } },
  { id: 'medical_1',  name: 'Medical Bay 1',     type: 'medical', position: { x: 55, y: 25 } },
  { id: 'medical_2',  name: 'Medical Bay 2',     type: 'medical', position: { x: 55, y: 75 } },
  { id: 'vip_lounge', name: 'VIP Lounge',        type: 'vip', position: { x: 50, y: 50 } },
];

const nodes = [...seatingBlocks, ...gates, ...facilities];

// --- EDGES ---
// Connect adjacent seating blocks in a ring
const edges = [];

for (let i = 0; i < 18; i++) {
  const next = (i + 1) % 18;
  edges.push({
    from: `block_${BLOCK_NAMES[i]}`,
    to: `block_${BLOCK_NAMES[next]}`,
    distance: 3,
  });
}

// Connect gates to nearby blocks
const gateConnections = [
  { gate: 'gate_1', blocks: ['block_A', 'block_B', 'block_R'], facilities: ['washroom_1', 'washroom_5', 'food_1'] },
  { gate: 'gate_2', blocks: ['block_E', 'block_F', 'block_D'], facilities: ['washroom_2', 'food_2'] },
  { gate: 'gate_3', blocks: ['block_I', 'block_J', 'block_K'], facilities: ['washroom_3', 'washroom_6', 'food_3'] },
  { gate: 'gate_4', blocks: ['block_N', 'block_O', 'block_M'], facilities: ['washroom_4', 'food_4'] },
];

gateConnections.forEach(({ gate, blocks, facilities: facs }) => {
  blocks.forEach(block => {
    edges.push({ from: gate, to: block, distance: 4 });
  });
  facs.forEach(fac => {
    edges.push({ from: gate, to: fac, distance: 2 });
  });
});

// Connect facilities to nearby blocks
const facilityConnections = [
  { facility: 'washroom_1', blocks: ['block_A', 'block_R'] },
  { facility: 'washroom_2', blocks: ['block_E', 'block_D'] },
  { facility: 'washroom_3', blocks: ['block_J', 'block_K'] },
  { facility: 'washroom_4', blocks: ['block_N', 'block_O'] },
  { facility: 'washroom_5', blocks: ['block_B', 'block_C'] },
  { facility: 'washroom_6', blocks: ['block_H', 'block_I'] },
  { facility: 'food_1',     blocks: ['block_A', 'block_B'] },
  { facility: 'food_2',     blocks: ['block_E', 'block_F'] },
  { facility: 'food_3',     blocks: ['block_I', 'block_J'] },
  { facility: 'food_4',     blocks: ['block_N', 'block_M'] },
  { facility: 'medical_1',  blocks: ['block_B', 'block_C', 'block_D'] },
  { facility: 'medical_2',  blocks: ['block_I', 'block_H', 'block_J'] },
  { facility: 'vip_lounge', blocks: ['block_A', 'block_E', 'block_I', 'block_N'] },
];

facilityConnections.forEach(({ facility, blocks }) => {
  blocks.forEach(block => {
    edges.push({ from: facility, to: block, distance: 2 });
  });
});

// Cross-connections for more routing options
const crossConnections = [
  { from: 'block_A', to: 'block_J', distance: 8 },
  { from: 'block_E', to: 'block_N', distance: 8 },
  { from: 'medical_1', to: 'medical_2', distance: 6 },
  { from: 'food_1', to: 'food_3', distance: 7 },
  { from: 'food_2', to: 'food_4', distance: 7 },
  { from: 'vip_lounge', to: 'medical_1', distance: 3 },
  { from: 'vip_lounge', to: 'medical_2', distance: 3 },
];

edges.push(...crossConnections);

// --- EXPORT ---
module.exports = {
  nodes,
  edges,
  BLOCK_NAMES,
  // Quick lookup helpers
  getNode: (id) => nodes.find(n => n.id === id),
  getNodesByType: (type) => nodes.filter(n => n.type === type),
  findNodeByName: (query) => {
    const q = query.toLowerCase().trim();
    return nodes.find(n => 
      n.name.toLowerCase().includes(q) || 
      n.id.toLowerCase().includes(q)
    );
  },
};
