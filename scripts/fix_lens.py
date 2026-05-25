import re

path = r'E:\公众号\opticskit\src\app\tools\lens\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """    // Realistic lens cross-section
    const lensH = 80 * scale;
    const thick = 10 * scale;

    ctx.strokeStyle = "rgba(0,191,255,0.7)"; ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(0,191,255,0.06)";

    // Left surface endpoints
    const lxTop = lensX - thick;
    const lxBot = lensX - thick;
    // Right surface endpoints
    const rxTop = lensX + thick;
    const rxBot = lensX + thick;

    // Control point for curvature: convex bulges outward, concave inward
    const bulgeX = thick * 3;
    const leftCtrlX = isConcave ? lensX + bulgeX : lensX - bulgeX;
    const rightCtrlX = isConcave ? lensX - bulgeX : lensX + bulgeX;

    ctx.beginPath();
    ctx.moveTo(lxTop, cy - lensH);
    ctx.quadraticCurveTo(leftCtrlX, cy, lxBot, cy + lensH);
    ctx.lineTo(rxBot, cy + lensH);
    ctx.quadraticCurveTo(rightCtrlX, cy, rxTop, cy - lensH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();"""

new = """    const D = 80 * scale, halfD = D / 2;
    const edgeThick = 8 * scale;
    const centerThick = isConcave ? 3 * scale : 28 * scale;
    const leftCx = lensX - centerThick / 2;
    const rightCx = lensX + centerThick / 2;
    const leftEdgeX = lensX - edgeThick / 2;
    const rightEdgeX = lensX + edgeThick / 2;

    ctx.strokeStyle = "rgba(0,191,255,0.7)"; ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(0,191,255,0.06)";

    ctx.beginPath();
    ctx.moveTo(leftEdgeX, cy - halfD);
    ctx.quadraticCurveTo(leftCx, cy, leftEdgeX, cy + halfD);
    ctx.lineTo(rightEdgeX, cy + halfD);
    ctx.quadraticCurveTo(rightCx, cy, rightEdgeX, cy - halfD);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(leftEdgeX, cy - halfD);
    ctx.quadraticCurveTo(leftCx, cy, leftEdgeX, cy + halfD);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightEdgeX, cy + halfD);
    ctx.quadraticCurveTo(rightCx, cy, rightEdgeX, cy - halfD);
    ctx.stroke();"""

assert old in content, "Old block not found!"
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done - lens body rewritten")
