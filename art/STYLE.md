# Placeholder geometry style (read before every piece)

- Blocky, chunky, stylised -- the Brutes' world: riveted plates, thick bevels, exaggerated proportions, readable from
  an RTS camera 15-60 m away. Silhouette over detail. NOT realistic, NOT thin.
- Low poly: props 200-2,000 tris, vehicles <= 4,000, buildings <= 6,000 (per piece). One draw call per piece if possible:
  ONE material per GLB using vertex colours or a small palette texture (<= 256 px), no image textures bigger than that.
- Palette: dull steel #6f6960, dark iron #3a3632, rust #8a4b2a, hazard orange #e8761c, olive cloth #5d6a3a, bone #d8cfb8,
  glow amber #ffb347 (emissive). TEAM COLOUR = pure crimson #D0102A on the pieces that should take the team hue
  (banners, panels, stripes); no other red anywhere -- the game recolours exactly that crimson per team.
- Units: metres, +Y up, the model faces +Z, the PIVOT/ORIGIN is the centre of the footprint at ground level (y = 0)
  unless the request says otherwise (weapons: origin at the grip, the blade/barrel along +Z).
- Export glTF binary (.glb), no Draco (the game session compresses), apply transforms, no cameras/lights.
- Breakable pieces: when the request says BREAKABLE, also export the same piece split into 4-8 chunks as separate
  named meshes `chunk_0..n` in one GLB (`<name>_chunks.glb`), each chunk's origin at its own centre.
