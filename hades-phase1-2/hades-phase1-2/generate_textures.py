#!/usr/bin/env python3
"""Generate all texture images for room types"""
from PIL import Image, ImageDraw, ImageFilter
import random
import math

def create_battle_floor():
    """Dark stone floor with blood stains"""
    size = 512
    img = Image.new('RGB', (size, size), (45, 35, 40))
    draw = ImageDraw.Draw(img)
    
    # Stone tiles
    tile_size = 64
    for i in range(size // tile_size):
        for j in range(size // tile_size):
            x, y = i * tile_size, j * tile_size
            var = random.randint(-8, 8)
            tile_col = (45 + var, 35 + var, 40 + var)
            draw.rectangle([x+1, y+1, x+tile_size-2, y+tile_size-2], fill=tile_col)
            draw.rectangle([x, y, x+tile_size, y+tile_size], outline=(30, 25, 28), width=1)
    
    # Blood stains
    for _ in range(15):
        x, y = random.randint(50, size-50), random.randint(50, size-50)
        r = random.randint(20, 50)
        for i in range(r, 0, -5):
            alpha = int(80 * (i / r))
            col = (100, 10, 10) if i > r//2 else (60, 5, 5)
            draw.ellipse([x-i, y-i, x+i, y+i], fill=col)
    
    img = img.filter(ImageFilter.GaussianBlur(1))
    return img

def create_battle_wall():
    """Stone wall with torch lighting"""
    size = 512
    img = Image.new('RGB', (size, size), (55, 45, 50))
    draw = ImageDraw.Draw(img)
    
    # Stone blocks
    for i in range(4):
        y = i * 128
        for j in range(2):
            x = j * 256 + (0 if i % 2 == 0 else 128)
            var = random.randint(-10, 10)
            col = (55 + var, 45 + var, 50 + var)
            draw.rectangle([x+2, y+2, x+250, y+124], fill=col)
            draw.rectangle([x, y, x+252, y+126], outline=(75, 65, 70), width=2)
    
    # Torch glow (top center)
    tx, ty = size//2, size//4
    for r in range(60, 10, -10):
        alpha = 255 - (60 - r) * 4
        glow = (255, int(100 * (r/60)), 0)
        draw.ellipse([tx-r, ty-r, tx+r, ty+r], fill=glow)
    
    img = img.filter(ImageFilter.GaussianBlur(2))
    return img

def create_boss_floor():
    """Ritual circle floor"""
    size = 512
    img = Image.new('RGB', (size, size), (20, 10, 15))
    draw = ImageDraw.Draw(img)
    
    # Dark tiles
    tile_size = 64
    for i in range(size // tile_size):
        for j in range(size // tile_size):
            x, y = i * tile_size, j * tile_size
            var = random.randint(-3, 3)
            draw.rectangle([x+1, y+1, x+tile_size-2, y+tile_size-2], 
                         fill=(20+var, 10+var, 15+var))
    
    # Ritual circle
    center = size // 2
    radius = size // 3
    draw.ellipse([center-radius, center-radius, center+radius, center+radius],
                outline=(180, 30, 30), width=4)
    
    # Pentagram
    points = []
    for i in range(10):
        angle = (i * 36 - 90) * math.pi / 180
        r = radius-20 if i % 2 == 0 else (radius-20) // 2
        points.append((center + r * math.cos(angle), center + r * math.sin(angle)))
    
    for i in range(len(points)):
        draw.line([points[i], points[(i+1)%len(points)]], fill=(180, 30, 30), width=3)
    
    img = img.filter(ImageFilter.GaussianBlur(1))
    return img

def create_hub_floor():
    """Marble floor with gold trim"""
    size = 512
    img = Image.new('RGB', (size, size), (90, 85, 80))
    draw = ImageDraw.Draw(img)
    
    # Marble tiles
    tile_size = 85
    for i in range(size // tile_size + 1):
        for j in range(size // tile_size + 1):
            x, y = i * tile_size, j * tile_size
            var = random.randint(-8, 8)
            col = (90+var, 85+var, 80+var)
            draw.rectangle([x+3, y+3, x+tile_size-3, y+tile_size-3], fill=col)
            draw.rectangle([x, y, x+tile_size, y+tile_size], 
                         outline=(220, 190, 80), width=3)
    
    # Central pool
    center = size // 2
    pool_r = size // 5
    for r in range(pool_r, 0, -5):
        blue = int(80 + (pool_r - r) * 1.5)
        draw.ellipse([center-r, center-r, center+r, center+r],
                    fill=(30, 50, blue))
    
    return img

def create_rest_floor():
    """Mossy stone floor"""
    size = 512
    img = Image.new('RGB', (size, size), (50, 60, 50))
    draw = ImageDraw.Draw(img)
    
    # Grass/moss base
    for i in range(size // 60):
        for j in range(size // 60):
            x = i * 60 + random.randint(-5, 5)
            y = j * 60 + random.randint(-5, 5)
            
            # Stone
            stone_r = random.randint(25, 35)
            var = random.randint(-10, 10)
            draw.ellipse([x, y, x+stone_r, y+stone_r], 
                        fill=(65+var, 65+var, 60+var))
            
            # Moss patches
            for _ in range(random.randint(2, 4)):
                mx = x + random.randint(5, stone_r-10)
                my = y + random.randint(5, stone_r-10)
                mr = random.randint(3, 8)
                draw.ellipse([mx, my, mx+mr, my+mr], fill=(40, 90, 40))
    
    # Flowers
    for _ in range(25):
        fx, fy = random.randint(0, size), random.randint(0, size)
        colors = [(220, 60, 60), (220, 220, 60), (160, 60, 220)]
        draw.ellipse([fx-2, fy-2, fx+2, fy+2], fill=random.choice(colors))
    
    img = img.filter(ImageFilter.GaussianBlur(1))
    return img

def create_final_floor():
    """Golden divine floor"""
    size = 512
    img = Image.new('RGB', (size, size), (80, 70, 55))
    draw = ImageDraw.Draw(img)
    
    # Golden tiles
    tile_size = 64
    for i in range(size // tile_size):
        for j in range(size // tile_size):
            x, y = i * tile_size, j * tile_size
            var = random.randint(-5, 10)
            col = (80+var, 70+var, 55+var)
            draw.rectangle([x+2, y+2, x+tile_size-2, y+tile_size-2], fill=col)
            draw.rectangle([x, y, x+tile_size, y+tile_size],
                         outline=(230, 210, 130), width=2)
    
    # Divine light rays from center
    center = size // 2
    for angle in range(0, 360, 30):
        rad = angle * math.pi / 180
        x2 = center + 200 * math.cos(rad)
        y2 = center + 200 * math.sin(rad)
        draw.line([center, center, x2, y2], fill=(250, 230, 150), width=2)
    
    # Central glow
    for r in range(80, 10, -10):
        alpha = 255 - (80 - r) * 3
        draw.ellipse([center-r, center-r, center+r, center+r],
                    fill=(255, 240, 180))
    
    return img

print("Generating textures...")

# Generate all floor textures
battle_floor = create_battle_floor()
battle_floor.save('assets/textures/battle_floor.png')
print("✓ Battle floor")

battle_wall = create_battle_wall()
battle_wall.save('assets/textures/battle_wall.png')
print("✓ Battle wall")

boss_floor = create_boss_floor()
boss_floor.save('assets/textures/boss_floor.png')
print("✓ Boss floor")

boss_wall = battle_wall  # Reuse with darker tint
boss_wall.save('assets/textures/boss_wall.png')
print("✓ Boss wall")

hub_floor = create_hub_floor()
hub_floor.save('assets/textures/hub_floor.png')
print("✓ Hub floor")

hub_wall = battle_wall  # Will tint in code
hub_wall.save('assets/textures/hub_wall.png')
print("✓ Hub wall")

rest_floor = create_rest_floor()
rest_floor.save('assets/textures/rest_floor.png')
print("✓ Rest floor")

rest_wall = battle_wall
rest_wall.save('assets/textures/rest_wall.png')
print("✓ Rest wall")

final_floor = create_final_floor()
final_floor.save('assets/textures/final_floor.png')
print("✓ Final floor")

final_wall = battle_wall
final_wall.save('assets/textures/final_wall.png')
print("✓ Final wall")

# Create bump map (generic stone normal map)
bump = Image.new('RGB', (512, 512), (128, 128, 255))
draw = ImageDraw.Draw(bump)
for _ in range(200):
    x, y = random.randint(0, 512), random.randint(0, 512)
    r = random.randint(5, 15)
    intensity = random.randint(100, 150)
    draw.ellipse([x-r, y-r, x+r, y+r], fill=(intensity, intensity, 200))
bump = bump.filter(ImageFilter.GaussianBlur(2))
bump.save('assets/textures/stone_bump.png')
print("✓ Bump map")

print("\n✅ All textures generated!")
