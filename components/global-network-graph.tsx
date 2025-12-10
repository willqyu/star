'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  email?: string;
  company?: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  notes?: string;
}

interface GlobalNetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  interactive?: boolean;
}

export function GlobalNetworkGraph({
  nodes,
  edges,
  interactive = true,
}: GlobalNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  // Initialize node positions using force-directed layout
  useEffect(() => {
    if (nodes.length === 0) return;

    // Simple force-directed layout
    const positions = new Map<string, { x: number; y: number }>();
    const padding = 100;
    const area = Math.sqrt(nodes.length) * 150;

    // Initialize random positions
    const initialPositions = nodes.map((node) => ({
      id: node.id,
      x: (Math.random() - 0.5) * area,
      y: (Math.random() - 0.5) * area,
      vx: 0,
      vy: 0,
    }));

    // Run force simulation for a few iterations
    for (let iteration = 0; iteration < 50; iteration++) {
      initialPositions.forEach((node, i) => {
        let fx = 0;
        let fy = 0;

        // Repulsion from other nodes
        initialPositions.forEach((other, j) => {
          if (i !== j) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 100 / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        });

        // Attraction to connected nodes
        edges.forEach((edge) => {
          let other: (typeof initialPositions)[0] | undefined;
          if (edge.source === node.id) {
            other = initialPositions.find((p) => p.id === edge.target);
          } else if (edge.target === node.id) {
            other = initialPositions.find((p) => p.id === edge.source);
          }

          if (other) {
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist * dist) / 100;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        });

        // Center attraction
        fx -= node.x * 0.01;
        fy -= node.y * 0.01;

        // Apply damping and update velocity
        node.vx = (node.vx + fx) * 0.8;
        node.vy = (node.vy + fy) * 0.8;

        // Update position
        node.x += node.vx;
        node.y += node.vy;
      });
    }

    // Convert to map
    initialPositions.forEach((pos) => {
      positions.set(pos.id, { x: pos.x, y: pos.y });
    });

    setNodePositions(positions);
  }, [nodes, edges]);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodePositions.size === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up transform
    ctx.save();
    ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
    ctx.scale(zoom, zoom);

    // Draw edges
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2 / zoom;

    edges.forEach((edge) => {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);

      if (!sourcePos || !targetPos) return;

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.stroke();

      // Draw edge label
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;

      ctx.fillStyle = '#6b7280';
      ctx.font = `11px / ${zoom} sans-serif`;
      ctx.textAlign = 'center';

      const labelMap: Record<string, string> = {
        referred_by: '↑ Referred',
        knows: '→ Knows',
        works_with: '↔ Works',
        friend: '❤ Friend',
      };

      ctx.fillText(labelMap[edge.type] || edge.type, midX, midY - 10);
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;

      const radius = 20;
      ctx.fillStyle = isHovered ? '#10b981' : '#f3f4f6';
      ctx.strokeStyle = isSelected ? '#f59e0b' : '#d1d5db';
      ctx.lineWidth = isSelected ? 4 / zoom : 2 / zoom;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#1f2937';
      ctx.font = `bold 10px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const nameParts = node.name.split(' ');
      const initials = nameParts.map((part) => part[0]).join('');
      ctx.fillText(initials.substring(0, 2), pos.x, pos.y);
    });

    ctx.restore();
  }, [edges, nodes, nodePositions, zoom, panX, panY, hoveredNode, selectedNode]);

  // Handle canvas mouse move for hover detection
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !interactive) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - canvas.width / 2 - panX;
    const mouseY = e.clientY - rect.top - canvas.height / 2 - panY;

    let hoveredId: string | null = null;

    for (const node of nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const radius = 20;
      const distance = Math.sqrt(
        Math.pow(mouseX / zoom - pos.x, 2) + Math.pow(mouseY / zoom - pos.y, 2)
      );

      if (distance < radius) {
        hoveredId = node.id;
        break;
      }
    }

    setHoveredNode(hoveredId);
  };

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !interactive) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - canvas.width / 2 - panX;
    const mouseY = e.clientY - rect.top - canvas.height / 2 - panY;

    for (const node of nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const radius = 20;
      const distance = Math.sqrt(
        Math.pow(mouseX / zoom - pos.x, 2) + Math.pow(mouseY / zoom - pos.y, 2)
      );

      if (distance < radius) {
        setSelectedNode(node.id);
        return;
      }
    }

    setSelectedNode(null);
  };

  // Handle pan with mouse drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPanX = panX;
    const startPanY = panY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setPanX(startPanX + deltaX);
      setPanY(startPanY + deltaY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta));
    setZoom(newZoom);
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedNode(null);
  };

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  if (nodes.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No contacts yet. Create your first contact!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative border rounded-lg bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          onMouseMove={handleCanvasMouseMove}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          className={`w-full border ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
        />

        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.min(3, zoom * 1.2))}
            disabled={!interactive}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.max(0.5, zoom * 0.8))}
            disabled={!interactive}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetView}
            disabled={!interactive}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded border text-xs space-y-1">
          <div className="font-bold mb-2">Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-400"></div>
            <span>Contact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Hovered</span>
          </div>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNodeData && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-lg mb-2">{selectedNodeData.name}</h3>
          {selectedNodeData.email && <p className="text-sm text-gray-600">Email: {selectedNodeData.email}</p>}
          {selectedNodeData.company && <p className="text-sm text-gray-600">Company: {selectedNodeData.company}</p>}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedNode(null)}
            className="mt-2"
          >
            Close
          </Button>
        </Card>
      )}

      {/* Graph Stats */}
      <Card className="p-4">
        <p className="text-sm text-gray-600">
          Network: {nodes.length} contact{nodes.length !== 1 ? 's' : ''} with {edges.length} connection{edges.length !== 1 ? 's' : ''}
        </p>
      </Card>
    </div>
  );
}
