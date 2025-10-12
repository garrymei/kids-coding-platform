"""
Custom turtle graphics module for SVG output.
This module provides a turtle graphics interface that generates SVG paths
instead of requiring a GUI environment.
"""

import math
import sys
import json
from typing import List, Tuple, Dict, Any


class TurtleState:
    def __init__(self):
        self.x = 0.0
        self.y = 0.0
        self.angle = 0.0  # degrees, 0 = east, 90 = north
        self.pen_down = True
        self.paths: List[str] = []
        self.segments: List[Dict[str, float]] = []  # Store segments for judge
        
    def forward(self, distance: float):
        """Move turtle forward by distance."""
        if self.pen_down:
            # Calculate new position
            radians = math.radians(self.angle)
            new_x = self.x + distance * math.cos(radians)
            new_y = self.y + distance * math.sin(radians)
            
            # Create a separate path for each forward movement
            path_data = f"M {self.x:.2f} {self.y:.2f} L {new_x:.2f} {new_y:.2f}"
            self.paths.append(path_data)
            
            # Add segment data for judge
            self.segments.append({
                "len": distance,
                "deg": self.angle % 360
            })
            
            # Update position
            self.x = new_x
            self.y = new_y
        else:
            # Just move without drawing
            radians = math.radians(self.angle)
            self.x += distance * math.cos(radians)
            self.y += distance * math.sin(radians)
    
    def right(self, angle: float):
        """Turn turtle right by angle degrees."""
        self.angle -= angle
        self.angle = self.angle % 360
    
    def left(self, angle: float):
        """Turn turtle left by angle degrees."""
        self.angle += angle
        self.angle = self.angle % 360
    
    def penup(self):
        """Lift the pen up."""
        self.pen_down = False
    
    def pendown(self):
        """Put the pen down."""
        self.pen_down = True
    
    def get_svg_paths(self) -> List[str]:
        """Get all SVG paths."""
        return self.paths.copy()
    
    def get_segments(self) -> List[Dict[str, float]]:
        """Get all segments for judge."""
        return self.segments.copy()


# Global turtle instance
_turtle = TurtleState()

# Public API functions
def forward(distance: float):
    """Move turtle forward by distance."""
    _turtle.forward(distance)

def right(angle: float):
    """Turn turtle right by angle degrees."""
    _turtle.right(angle)

def left(angle: float):
    """Turn turtle left by angle degrees."""
    _turtle.left(angle)

def penup():
    """Lift the pen up."""
    _turtle.penup()

def pendown():
    """Put the pen down."""
    _turtle.pendown()

def get_svg_output() -> str:
    """Get SVG representation of all drawn paths."""
    paths = _turtle.get_svg_paths()
    if not paths:
        return ""
    
    # Calculate bounding box
    all_points = []
    for path in paths:
        # Parse path data to extract points
        parts = path.split()
        i = 0
        while i < len(parts):
            if parts[i] in ['M', 'L']:
                if i + 2 < len(parts):
                    try:
                        x, y = float(parts[i + 1]), float(parts[i + 2])
                        all_points.append((x, y))
                    except ValueError:
                        pass
                i += 3
            else:
                i += 1
    
    if not all_points:
        return ""
    
    min_x = min(p[0] for p in all_points)
    max_x = max(p[0] for p in all_points)
    min_y = min(p[1] for p in all_points)
    max_y = max(p[1] for p in all_points)
    
    # Add padding
    padding = 10
    width = max_x - min_x + 2 * padding
    height = max_y - min_y + 2 * padding
    
    # Create SVG
    svg_paths = []
    for path in paths:
        svg_paths.append(f'<path d="{path}" stroke="black" stroke-width="2" fill="none"/>')
    
    svg = f'''<svg width="{width:.0f}" height="{height:.0f}" viewBox="{min_x - padding:.2f} {min_y - padding:.2f} {width:.2f} {height:.2f}" xmlns="http://www.w3.org/2000/svg">
{chr(10).join(svg_paths)}
</svg>'''
    
    return svg

def reset():
    """Reset turtle to initial state."""
    global _turtle
    _turtle = TurtleState()

# Module cleanup - output SVG and segments when module is done
def _output_svg():
    """Output SVG and segments to stdout when execution is complete."""
    import sys
    svg = get_svg_output()
    segments = _turtle.get_segments()
    
    if svg:
        sys.stdout.write("SVG_OUTPUT_START\n")
        sys.stdout.write(svg + "\n")
        sys.stdout.write("SVG_OUTPUT_END\n")
    
    if segments:
        sys.stdout.write("SEGMENTS_OUTPUT_START\n")
        sys.stdout.write(json.dumps({"segments": segments}) + "\n")
        sys.stdout.write("SEGMENTS_OUTPUT_END\n")
    
    sys.stdout.flush()

# Turtle class for object-oriented interface
class Turtle:
    """Turtle class that provides object-oriented interface to turtle graphics."""
    
    def __init__(self):
        # Use the global turtle state for simplicity
        pass
    
    def forward(self, distance: float):
        """Move turtle forward by distance."""
        forward(distance)
    
    def right(self, angle: float):
        """Turn turtle right by angle degrees."""
        right(angle)
    
    def left(self, angle: float):
        """Turn turtle left by angle degrees."""
        left(angle)
    
    def penup(self):
        """Lift the pen up."""
        penup()
    
    def pendown(self):
        """Put the pen down."""
        pendown()

# Register cleanup function
import atexit
atexit.register(_output_svg)