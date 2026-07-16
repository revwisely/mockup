const PptxGenJS = require("pptxgenjs");

// Initialize presentation
const pres = new PptxGenJS();
pres.defineLayout({ name: "16x9", width: 10, height: 5.625 });
pres.layout = "16x9";

// Color palette
const colors = {
  bgDeep: "0d1117",
  bgSurface: "161b22",
  bgElevated: "1c2333",
  bgCard: "21262d",
  steelBlue: "4A9ECE",
  coral: "E06C75",
  sageGreen: "98C379",
  amber: "E5C07B",
  purple: "C678DD",
  cyan: "56B6C2",
  orange: "D19A66",
  textPrimary: "E6EDF3",
  textSecondary: "8B949E",
  textMuted: "484F58",
  border: "30363d",
  accentBorder: "1F3A4E",
};

// Helper functions
function addDarkBg(slide) {
  slide.background = { color: colors.bgDeep };
}

function createShadow() {
  return {
    type: "outer",
    blur: 6,
    offset: 2,
    color: "000000",
    opacity: 0.12,
    angle: 135,
  };
}

function addTextBox(slide, text, options = {}) {
  const defaults = {
    fontFace: "Calibri",
    fontSize: 14,
    color: colors.textPrimary,
    margin: 0,
  };
  slide.addText(text, { ...defaults, ...options });
}

function addCodeBox(slide, text, options = {}) {
  const defaults = {
    fontFace: "Consolas",
    fontSize: 11,
    color: colors.textPrimary,
    margin: 0,
  };
  slide.addText(text, { ...defaults, ...options });
}

// ============================================================================
// SLIDE 1: COVER
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  // Top left: Comment
  addCodeBox(slide, "// Brand Guide", {
    x: 0.5,
    y: 0.4,
    fontSize: 11,
    color: colors.textMuted,
  });

  // Center title: magnetiz.ai
  slide.addText("magnetiz", {
    x: 1,
    y: 1.8,
    w: 4,
    h: 0.6,
    fontFace: "Consolas",
    fontSize: 44,
    bold: true,
    color: colors.textPrimary,
    margin: 0,
  });

  slide.addText(".ai", {
    x: 5,
    y: 1.8,
    w: 1,
    h: 0.6,
    fontFace: "Consolas",
    fontSize: 44,
    bold: true,
    color: colors.steelBlue,
    margin: 0,
  });

  // Subtitle
  addCodeBox(slide, "Terminal Design System", {
    x: 1,
    y: 2.5,
    fontSize: 13,
    color: colors.textMuted,
  });

  // Version
  addTextBox(slide, "v1.0 — February 2026", {
    x: 1,
    y: 2.8,
    fontSize: 12,
    color: colors.textMuted,
  });

  // Thin line
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 3.1,
    w: 9,
    h: 0.02,
    fill: { color: colors.border },
    line: { type: "none" },
  });

  // Tagline
  addTextBox(slide, "AI Agents That Work in Production", {
    x: 0.5,
    y: 3.3,
    w: 9,
    fontSize: 15,
    color: colors.textSecondary,
    align: "center",
  });
}

// ============================================================================
// SLIDE 2: TABLE OF CONTENTS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  // Header
  addCodeBox(slide, "// Contents", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.sageGreen,
  });

  addCodeBox(slide, "Brand Guide", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  // Content grid
  const items = [
    { num: "01", name: "Logo & Wordmark" },
    { num: "02", name: "Color System" },
    { num: "03", name: "Typography" },
    { num: "04", name: "Spacing & Layout" },
    { num: "05", name: "Effects" },
    { num: "06", name: "Components" },
    { num: "07", name: "Buttons & CTAs" },
    { num: "08", name: "Voice & Tone" },
    { num: "09", name: "Usage Guidelines" },
  ];

  let row = 0;
  let col = 0;
  items.forEach((item, idx) => {
    const x = col === 0 ? 0.5 : 5.2;
    const y = 1.3 + row * 0.42;

    addCodeBox(slide, item.num, {
      x: x,
      y: y,
      fontSize: 12,
      bold: true,
      color: colors.steelBlue,
    });

    addTextBox(slide, item.name, {
      x: x + 0.35,
      y: y,
      fontSize: 14,
      color: colors.textPrimary,
    });

    col = col === 0 ? 1 : 0;
    if (col === 0) row++;
  });
}

// ============================================================================
// SLIDE 3: LOGO & WORDMARK
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "01", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.textMuted,
  });

  addCodeBox(slide, "Logo & Wordmark", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  addTextBox(slide, "The wordmark is text-only — no icon, no symbol.", {
    x: 0.5,
    y: 1.1,
    w: 9,
    fontSize: 14,
    color: colors.textSecondary,
  });

  // Logo panels
  const panelY = 1.5;
  const panelW = 2.8;
  const panelH = 1.2;
  const panels = [
    { bg: colors.bgSurface, label: "On dark (primary)" },
    { bg: colors.bgElevated, label: "On surface" },
    { bg: "F0F2F5", label: "On light (exception)" },
  ];

  panels.forEach((panel, idx) => {
    const x = 0.5 + idx * 3.2;

    // Background
    slide.addShape(pres.ShapeType.rect, {
      x: x,
      y: panelY,
      w: panelW,
      h: panelH,
      fill: { color: panel.bg },
      line: { color: colors.border, width: 1 },
    });

    // Wordmark text
    const isLight = panel.bg === "F0F2F5";
    slide.addText("magnetiz", {
      x: x + 0.15,
      y: panelY + 0.35,
      w: panelW - 0.3,
      fontFace: "Consolas",
      fontSize: 16,
      bold: true,
      color: isLight ? colors.bgDeep : colors.textPrimary,
      margin: 0,
    });

    slide.addText(".ai", {
      x: x + 1.4,
      y: panelY + 0.35,
      w: 0.8,
      fontFace: "Consolas",
      fontSize: 16,
      bold: true,
      color: colors.steelBlue,
      margin: 0,
    });

    // Label
    addTextBox(slide, panel.label, {
      x: x,
      y: panelY + 1.25,
      w: panelW,
      fontSize: 11,
      color: colors.textMuted,
      align: "center",
    });
  });

  // Specs
  addCodeBox(slide, "Font: Consolas Bold | Nav: 20px | Display: 28px | Accent: 4A9ECE on .ai only", {
    x: 0.5,
    y: 2.95,
    fontSize: 11,
    color: colors.textMuted,
  });
}

// ============================================================================
// SLIDE 4: LOGO DO'S & DON'TS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "Logo Usage", {
    x: 0.5,
    y: 0.4,
    fontSize: 24,
    bold: true,
    color: colors.textPrimary,
  });

  // Do's card
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1,
    w: 4.5,
    h: 4,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  // Do's left border
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1,
    w: 0.08,
    h: 4,
    fill: { color: colors.sageGreen },
    line: { type: "none" },
  });

  addCodeBox(slide, "Do", {
    x: 0.8,
    y: 1.15,
    fontSize: 16,
    bold: true,
    color: colors.sageGreen,
  });

  const doList = [
    "Always lowercase: magnetiz.ai",
    'Keep ".ai" in Steel Blue',
    "Use monospace exclusively",
    "Maintain minimum clear space",
  ];

  doList.forEach((item, idx) => {
    addTextBox(slide, "• " + item, {
      x: 0.8,
      y: 1.55 + idx * 0.55,
      w: 3.9,
      fontSize: 11,
      color: colors.textSecondary,
    });
  });

  // Don'ts card
  slide.addShape(pres.ShapeType.rect, {
    x: 5.2,
    y: 1,
    w: 4.5,
    h: 4,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  // Don'ts left border
  slide.addShape(pres.ShapeType.rect, {
    x: 5.2,
    y: 1,
    w: 0.08,
    h: 4,
    fill: { color: colors.coral },
    line: { type: "none" },
  });

  addCodeBox(slide, "Don't", {
    x: 5.5,
    y: 1.15,
    fontSize: 16,
    bold: true,
    color: colors.coral,
  });

  const dontList = [
    "Capitalize: magnetiz.ai -> Magnetiz.AI",
    "Change the accent color",
    "Use a different typeface",
    "Add drop shadows or effects",
  ];

  dontList.forEach((item, idx) => {
    addTextBox(slide, "• " + item, {
      x: 5.5,
      y: 1.55 + idx * 0.55,
      w: 3.9,
      fontSize: 11,
      color: colors.textSecondary,
    });
  });
}

// ============================================================================
// SLIDE 5: COLOR SYSTEM — BACKGROUNDS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "02", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.textMuted,
  });

  addCodeBox(slide, "Color System — Backgrounds", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  const swatches = [
    { color: colors.bgDeep, label: "Deep\n0d1117", var: "bg-deep" },
    { color: colors.bgSurface, label: "Surface\n161b22", var: "bg-surface" },
    { color: colors.bgElevated, label: "Elevated\n1c2333", var: "bg-elevated" },
    { color: colors.bgCard, label: "Card\n21262d", var: "bg-card" },
  ];

  swatches.forEach((swatch, idx) => {
    const x = 0.5 + idx * 2.3;

    slide.addShape(pres.ShapeType.rect, {
      x: x,
      y: 1.3,
      w: 2,
      h: 1.4,
      fill: { color: swatch.color },
      line: { color: colors.border, width: 1 },
    });

    addTextBox(slide, swatch.label, {
      x: x,
      y: 2.8,
      w: 2,
      fontSize: 11,
      color: colors.textSecondary,
      align: "center",
    });

    addCodeBox(slide, swatch.var, {
      x: x,
      y: 3.3,
      w: 2,
      fontSize: 10,
      color: colors.textMuted,
      align: "center",
    });
  });
}

// ============================================================================
// SLIDE 6: COLOR SYSTEM — ACCENTS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "Color System — Primary & Accents", {
    x: 0.5,
    y: 0.4,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  const primarySwatches = [
    { color: colors.steelBlue, label: "Steel Blue\n(Primary)\n4A9ECE" },
    { color: colors.coral, label: "Coral\n(Secondary)\nE06C75" },
    { color: colors.sageGreen, label: "Sage Green\n(Success)\n98C379" },
    { color: colors.amber, label: "Amber\n(Warning)\nE5C07B" },
  ];

  primarySwatches.forEach((swatch, idx) => {
    const x = 0.5 + idx * 2.25;

    slide.addShape(pres.ShapeType.rect, {
      x: x,
      y: 1.1,
      w: 2,
      h: 1.3,
      fill: { color: swatch.color },
      line: { type: "none" },
    });

    addTextBox(slide, swatch.label, {
      x: x,
      y: 2.5,
      w: 2,
      fontSize: 11,
      color: colors.textSecondary,
      align: "center",
    });
  });

  addTextBox(slide, "Extended Palette", {
    x: 0.5,
    y: 3.2,
    fontSize: 14,
    bold: true,
    color: colors.textPrimary,
  });

  const extendedSwatches = [
    { color: colors.purple, label: "Purple\n(Keywords)\nC678DD" },
    { color: colors.cyan, label: "Cyan\n(Built-ins)\n56B6C2" },
    { color: colors.orange, label: "Orange\n(Numbers)\nD19A66" },
  ];

  extendedSwatches.forEach((swatch, idx) => {
    const x = 0.5 + idx * 2.8;

    slide.addShape(pres.ShapeType.rect, {
      x: x,
      y: 3.5,
      w: 2.2,
      h: 1.2,
      fill: { color: swatch.color },
      line: { type: "none" },
    });

    addTextBox(slide, swatch.label, {
      x: x,
      y: 4.8,
      w: 2.2,
      fontSize: 10,
      color: colors.textSecondary,
      align: "center",
    });
  });
}

// ============================================================================
// SLIDE 7: COLOR SYSTEM — TEXT & BORDERS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "Color System — Text & Borders", {
    x: 0.5,
    y: 0.4,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  // Text colors
  addTextBox(slide, "Text Colors", {
    x: 0.5,
    y: 1.2,
    fontSize: 14,
    bold: true,
    color: colors.textPrimary,
  });

  const textSwatches = [
    { color: colors.textPrimary, label: "Primary Text\nE6EDF3" },
    { color: colors.textSecondary, label: "Secondary Text\n8B949E" },
    { color: colors.textMuted, label: "Muted Text\n484F58" },
  ];

  textSwatches.forEach((swatch, idx) => {
    const x = 0.5 + idx * 2.8;

    slide.addShape(pres.ShapeType.rect, {
      x: x,
      y: 1.6,
      w: 2.5,
      h: 1.1,
      fill: { color: swatch.color },
      line: { type: "none" },
    });

    addTextBox(slide, swatch.label, {
      x: x,
      y: 2.8,
      w: 2.5,
      fontSize: 10,
      color: colors.bgDeep,
      align: "center",
    });
  });

  // Borders
  addTextBox(slide, "Borders", {
    x: 0.5,
    y: 3.3,
    fontSize: 14,
    bold: true,
    color: colors.textPrimary,
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 3.7,
    w: 2.5,
    h: 1.1,
    fill: { color: colors.border },
    line: { type: "none" },
  });

  addTextBox(slide, "Default Border\n30363d", {
    x: 0.5,
    y: 4.8,
    w: 2.5,
    fontSize: 10,
    color: colors.textMuted,
    align: "center",
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 3.2,
    y: 3.7,
    w: 2.5,
    h: 1.1,
    fill: { color: colors.accentBorder },
    line: { type: "none" },
  });

  addTextBox(slide, "Accent Border\n1F3A4E", {
    x: 3.2,
    y: 4.8,
    w: 2.5,
    fontSize: 10,
    color: colors.textMuted,
    align: "center",
  });

  // Note
  addCodeBox(slide, "Steel Blue is the primary accent. Coral for warnings. Green for success/labels.", {
    x: 0.5,
    y: 5.2,
    fontSize: 10,
    color: colors.textMuted,
  });
}

// ============================================================================
// SLIDE 8: TYPOGRAPHY
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "03", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.textMuted,
  });

  addCodeBox(slide, "Typography", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  // Left panel: Display/Headings
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1.3,
    w: 4.5,
    h: 3.8,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  addTextBox(slide, "Display / Headings", {
    x: 0.8,
    y: 1.5,
    fontSize: 12,
    bold: true,
    color: colors.steelBlue,
  });

  slide.addText("We build AI agents that work in ", {
    x: 0.8,
    y: 2,
    fontFace: "Consolas",
    fontSize: 18,
    bold: true,
    color: colors.textPrimary,
    margin: 0,
  });

  slide.addText("production", {
    x: 0.8,
    y: 2.3,
    fontFace: "Consolas",
    fontSize: 18,
    bold: true,
    color: colors.steelBlue,
    margin: 0,
  });

  addCodeBox(slide, "JetBrains Mono — 300–800", {
    x: 0.8,
    y: 3.1,
    fontSize: 10,
    color: colors.textMuted,
  });

  // Right panel: Body/Long-form
  slide.addShape(pres.ShapeType.rect, {
    x: 5.2,
    y: 1.3,
    w: 4.5,
    h: 3.8,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  addTextBox(slide, "Body / Long-form", {
    x: 5.5,
    y: 1.5,
    fontSize: 12,
    bold: true,
    color: colors.steelBlue,
  });

  addTextBox(
    slide,
    "Evaluation-first frameworks. Production-ready in less than 30 days.",
    {
      x: 5.5,
      y: 2.1,
      w: 3.9,
      fontSize: 14,
      color: colors.textSecondary,
    }
  );

  addCodeBox(slide, "DM Sans — 300–700", {
    x: 5.5,
    y: 3.1,
    fontSize: 10,
    color: colors.textMuted,
  });
}

// ============================================================================
// SLIDE 9: TYPE SCALE
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "Type Scale", {
    x: 0.5,
    y: 0.4,
    fontSize: 24,
    bold: true,
    color: colors.textPrimary,
  });

  // Table data
  const tableData = [
    [
      { text: "Element", options: { bold: true } },
      { text: "Font", options: { bold: true } },
      { text: "Size", options: { bold: true } },
      { text: "Weight", options: { bold: true } },
    ],
    [
      { text: "Hero Headline" },
      { text: "Consolas" },
      { text: "44px" },
      { text: "Bold" },
    ],
    [
      { text: "Section Title" },
      { text: "Consolas" },
      { text: "28px" },
      { text: "Bold" },
    ],
    [
      { text: "Card Title" },
      { text: "Calibri" },
      { text: "18px" },
      { text: "Bold" },
    ],
    [
      { text: "Section Label" },
      { text: "Consolas" },
      { text: "11px" },
      { text: "Regular" },
    ],
    [
      { text: "Body Copy" },
      { text: "Calibri" },
      { text: "14px" },
      { text: "Regular" },
    ],
    [
      { text: "Button Text" },
      { text: "Consolas" },
      { text: "14px" },
      { text: "Bold" },
    ],
    [
      { text: "Terminal Code" },
      { text: "Consolas" },
      { text: "12px" },
      { text: "Regular" },
    ],
  ];

  slide.addTable(tableData, {
    x: 0.5,
    y: 1.0,
    w: 9,
    h: 4.3,
    border: { pt: 1, color: colors.border },
    fill: { color: colors.bgSurface },
    rowH: 0.5,
    fontFace: "Calibri",
    fontSize: 11,
    color: colors.textSecondary,
    align: "left",
    valign: "middle",
    margin: [4, 8, 4, 8],
  });
}

// ============================================================================
// SLIDE 10: SPACING & EFFECTS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "04 + 05", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.textMuted,
  });

  addCodeBox(slide, "Spacing & Atmosphere", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  // Spacing panel
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1.3,
    w: 4.5,
    h: 3.8,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  addTextBox(slide, "Spacing", {
    x: 0.8,
    y: 1.5,
    fontSize: 12,
    bold: true,
    color: colors.steelBlue,
  });

  const spacingItems = [
    "Section padding: 120px",
    "Container width: 1200px",
    "Card padding: 36px 32px",
    "Border radius: 12px",
  ];

  spacingItems.forEach((item, idx) => {
    addCodeBox(slide, item, {
      x: 0.8,
      y: 2.0 + idx * 0.45,
      fontSize: 11,
      color: colors.textSecondary,
    });
  });

  // Effects panel
  slide.addShape(pres.ShapeType.rect, {
    x: 5.2,
    y: 1.3,
    w: 4.5,
    h: 3.8,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  addTextBox(slide, "Effects", {
    x: 5.5,
    y: 1.5,
    fontSize: 12,
    bold: true,
    color: colors.steelBlue,
  });

  const effectsItems = [
    "Glow system: sm/md/lg",
    "Background: dot grid",
    "Animations: scroll reveal",
    "Card hover: lift effect",
  ];

  effectsItems.forEach((item, idx) => {
    addCodeBox(slide, item, {
      x: 5.5,
      y: 2.0 + idx * 0.45,
      fontSize: 11,
      color: colors.textSecondary,
    });
  });
}

// ============================================================================
// SLIDE 11: COMPONENTS — TERMINAL CHROME
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "06", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.textMuted,
  });

  addCodeBox(slide, "Components — Terminal Chrome", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  // Terminal window
  const termW = 7;
  const termH = 2.8;
  const termX = 1.5;
  const termY = 1.4;

  slide.addShape(pres.ShapeType.rect, {
    x: termX,
    y: termY,
    w: termW,
    h: termH,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  // Title bar
  slide.addShape(pres.ShapeType.rect, {
    x: termX,
    y: termY,
    w: termW,
    h: 0.35,
    fill: { color: colors.bgElevated },
    line: { type: "none" },
  });

  // Traffic lights
  const lights = [
    { color: "FF5F56", x: termX + 0.15 },
    { color: "FFBD2E", x: termX + 0.35 },
    { color: "27C93F", x: termX + 0.55 },
  ];

  lights.forEach((light) => {
    slide.addShape(pres.ShapeType.ellipse, {
      x: light.x,
      y: termY + 0.08,
      w: 0.12,
      h: 0.12,
      fill: { color: light.color },
      line: { type: "none" },
    });
  });

  // Filename
  addCodeBox(slide, "agent.ts", {
    x: termX + 0.95,
    y: termY + 0.05,
    fontSize: 10,
    color: colors.textSecondary,
  });

  // Code lines
  const codeLines = [
    "function deploy() {",
    '  console.log("Starting deployment...");',
    "  await runTests();",
    "}",
  ];

  codeLines.forEach((line, idx) => {
    addCodeBox(slide, line, {
      x: termX + 0.2,
      y: termY + 0.55 + idx * 0.45,
      fontSize: 10,
      color: colors.textSecondary,
    });
  });

  // Status bar
  slide.addShape(pres.ShapeType.rect, {
    x: termX,
    y: termY + termH - 0.25,
    w: termW,
    h: 0.25,
    fill: { color: colors.bgElevated },
    line: { type: "none" },
  });

  addCodeBox(slide, "STATUS: READY", {
    x: termX + 0.2,
    y: termY + termH - 0.23,
    fontSize: 10,
    color: colors.sageGreen,
  });

  addCodeBox(slide, "Ln 1, Col 1", {
    x: termX + termW - 0.8,
    y: termY + termH - 0.23,
    fontSize: 10,
    color: colors.textMuted,
  });
}

// ============================================================================
// SLIDE 12: COMPONENTS — CARDS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "Components — Cards", {
    x: 0.5,
    y: 0.4,
    fontSize: 24,
    bold: true,
    color: colors.textPrimary,
  });

  // Card 1: Service
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1.2,
    w: 2.8,
    h: 3.8,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1.2,
    w: 2.8,
    h: 0.06,
    fill: { color: colors.steelBlue },
    line: { type: "none" },
  });

  addTextBox(slide, "Service Card", {
    x: 0.7,
    y: 1.5,
    w: 2.4,
    fontSize: 13,
    bold: true,
    color: colors.textPrimary,
  });

  addTextBox(slide, "AI-powered testing infrastructure for production deployments.", {
    x: 0.7,
    y: 2.0,
    w: 2.4,
    fontSize: 10,
    color: colors.textSecondary,
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.7,
    y: 3.4,
    w: 1,
    h: 0.3,
    fill: { color: colors.sageGreen },
    line: { type: "none" },
  });

  addTextBox(slide, "Featured", {
    x: 0.7,
    y: 3.4,
    w: 1,
    fontSize: 10,
    bold: true,
    color: colors.bgDeep,
    align: "center",
    valign: "middle",
  });

  // Card 2: Stat
  slide.addShape(pres.ShapeType.rect, {
    x: 3.6,
    y: 1.2,
    w: 2.8,
    h: 3.8,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  slide.addText("85%", {
    x: 3.8,
    y: 2.1,
    w: 2.4,
    fontFace: "Consolas",
    fontSize: 32,
    bold: true,
    color: colors.steelBlue,
    align: "center",
    margin: 0,
  });

  addTextBox(slide, "Tests Pass Rate", {
    x: 3.8,
    y: 2.8,
    w: 2.4,
    fontSize: 12,
    color: colors.textSecondary,
    align: "center",
  });

  // Card 3: Manifesto
  slide.addShape(pres.ShapeType.rect, {
    x: 6.7,
    y: 1.2,
    w: 2.8,
    h: 3.8,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  addTextBox(slide, "Custom Agents", {
    x: 6.9,
    y: 2.0,
    w: 2.4,
    fontSize: 12,
    bold: true,
    color: colors.textPrimary,
  });

  addTextBox(slide, "Generic Tools", {
    x: 6.9,
    y: 2.4,
    w: 2.4,
    fontSize: 12,
    bold: true,
    color: colors.coral,
  });

  addTextBox(slide, "(strikethrough)", {
    x: 6.9,
    y: 2.4,
    w: 2.4,
    fontSize: 9,
    color: colors.textMuted,
  });
}

// ============================================================================
// SLIDE 13: BUTTONS & CTAS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "07", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.textMuted,
  });

  addCodeBox(slide, "Buttons & CTAs", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  // Primary button
  slide.addShape(pres.ShapeType.rect, {
    x: 1.5,
    y: 1.4,
    w: 2.5,
    h: 0.45,
    fill: { color: colors.steelBlue },
    line: { type: "none" },
  });

  addCodeBox(slide, "Schedule Call", {
    x: 1.5,
    y: 1.4,
    w: 2.5,
    h: 0.45,
    fontSize: 14,
    bold: true,
    color: colors.textPrimary,
    align: "center",
    valign: "middle",
  });

  addTextBox(slide, "Primary Button", {
    x: 1.5,
    y: 2.0,
    w: 2.5,
    fontSize: 11,
    color: colors.textMuted,
    align: "center",
  });

  // Ghost button
  slide.addShape(pres.ShapeType.rect, {
    x: 5.5,
    y: 1.4,
    w: 2.5,
    h: 0.45,
    fill: { color: colors.bgDeep },
    line: { color: colors.border, width: 1 },
  });

  addCodeBox(slide, "Learn More", {
    x: 5.5,
    y: 1.4,
    w: 2.5,
    h: 0.45,
    fontSize: 14,
    bold: true,
    color: colors.textPrimary,
    align: "center",
    valign: "middle",
  });

  addTextBox(slide, "Ghost Button", {
    x: 5.5,
    y: 2.0,
    w: 2.5,
    fontSize: 11,
    color: colors.textMuted,
    align: "center",
  });

  // Specs table
  const buttonTableData = [
    [
      { text: "Property", options: { bold: true } },
      { text: "Primary", options: { bold: true } },
      { text: "Ghost", options: { bold: true } },
    ],
    [
      { text: "Background" },
      { text: "Steel Blue" },
      { text: "Deep (none)" },
    ],
    [{ text: "Text Color" }, { text: "White" }, { text: "Primary" }],
    [{ text: "Border" }, { text: "None" }, { text: "1px Border" }],
    [{ text: "Padding" }, { text: "12px 24px" }, { text: "12px 24px" }],
    [{ text: "Radius" }, { text: "4px" }, { text: "4px" }],
  ];

  slide.addTable(buttonTableData, {
    x: 1.5,
    y: 2.5,
    w: 6.5,
    h: 2.5,
    border: { pt: 1, color: colors.border },
    fill: { color: colors.bgSurface },
    rowH: 0.4,
    fontFace: "Calibri",
    fontSize: 10,
    color: colors.textSecondary,
    align: "center",
    valign: "middle",
    margin: [4, 8, 4, 8],
  });
}

// ============================================================================
// SLIDE 14: VOICE & TONE
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "08", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.textMuted,
  });

  addCodeBox(slide, "Voice & Tone", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  addTextBox(
    slide,
    "We speak like a senior engineer — precise, confident, no-nonsense.",
    {
      x: 0.5,
      y: 1.15,
      w: 9,
      fontSize: 14,
      color: colors.textSecondary,
    }
  );

  // Attribute cards
  const attributes = [
    {
      title: "Technical",
      desc: "We speak the language of engineering",
      x: 0.5,
      y: 1.7,
    },
    {
      title: "Evidence-based",
      desc: "Claims backed by data and outcomes",
      x: 5,
      y: 1.7,
    },
    { title: "Direct", desc: "Short sentences. Active voice.", x: 0.5, y: 3.3 },
    {
      title: "Confident",
      desc: "If we can't show ROI — you don't pay.",
      x: 5,
      y: 3.3,
    },
  ];

  attributes.forEach((attr) => {
    slide.addShape(pres.ShapeType.rect, {
      x: attr.x,
      y: attr.y,
      w: 4.2,
      h: 1.4,
      fill: { color: colors.bgSurface },
      line: { color: colors.border, width: 1 },
    });

    addTextBox(slide, attr.title, {
      x: attr.x + 0.3,
      y: attr.y + 0.15,
      fontSize: 13,
      bold: true,
      color: colors.steelBlue,
    });

    addTextBox(slide, attr.desc, {
      x: attr.x + 0.3,
      y: attr.y + 0.6,
      w: 3.6,
      fontSize: 11,
      color: colors.textSecondary,
    });
  });
}

// ============================================================================
// SLIDE 15: WRITING PATTERNS
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "Writing Patterns", {
    x: 0.5,
    y: 0.4,
    fontSize: 24,
    bold: true,
    color: colors.textPrimary,
  });

  // Do's
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1,
    w: 4.5,
    h: 4.3,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.5,
    y: 1,
    w: 0.08,
    h: 4.3,
    fill: { color: colors.sageGreen },
    line: { type: "none" },
  });

  addCodeBox(slide, "DO", {
    x: 0.8,
    y: 1.15,
    fontSize: 16,
    bold: true,
    color: colors.sageGreen,
  });

  const doPatterns = [
    "Production-ready in less than 30 days",
    "We deploy automated testing infrastructure",
    "If we can't show ROI — you don't pay.",
    "Evaluation-first frameworks",
  ];

  doPatterns.forEach((pattern, idx) => {
    addTextBox(slide, "• " + pattern, {
      x: 0.8,
      y: 1.55 + idx * 0.65,
      w: 3.9,
      fontSize: 11,
      color: colors.textSecondary,
    });
  });

  // Don'ts
  slide.addShape(pres.ShapeType.rect, {
    x: 5.2,
    y: 1,
    w: 4.5,
    h: 4.3,
    fill: { color: colors.bgSurface },
    line: { color: colors.border, width: 1 },
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 5.2,
    y: 1,
    w: 0.08,
    h: 4.3,
    fill: { color: colors.coral },
    line: { type: "none" },
  });

  addCodeBox(slide, "DON'T", {
    x: 5.5,
    y: 1.15,
    fontSize: 16,
    bold: true,
    color: colors.coral,
  });

  const dontPatterns = [
    "Unlock the power of AI for your business",
    "Our innovative solutions leverage cutting-edge",
    "Transform your enterprise with next-gen AI",
    "Synergize blockchain-enabled platforms",
  ];

  dontPatterns.forEach((pattern, idx) => {
    addTextBox(slide, "• " + pattern, {
      x: 5.5,
      y: 1.55 + idx * 0.65,
      w: 3.9,
      fontSize: 11,
      color: colors.textSecondary,
    });
  });
}

// ============================================================================
// SLIDE 16: USAGE GUIDELINES
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  addCodeBox(slide, "09", {
    x: 0.5,
    y: 0.3,
    fontSize: 11,
    color: colors.textMuted,
  });

  addCodeBox(slide, "Usage Guidelines", {
    x: 0.5,
    y: 0.65,
    fontSize: 28,
    bold: true,
    color: colors.textPrimary,
  });

  const guidelines = [
    {
      color: colors.steelBlue,
      title: "Steel Blue",
      desc: "Primary action, links, buttons, logo accent",
    },
    {
      color: colors.coral,
      title: "Coral",
      desc: "Warning, negation, contrast, strikethrough",
    },
    {
      color: colors.sageGreen,
      title: "Sage Green",
      desc: "Success, active states, section labels, tags",
    },
    {
      color: colors.amber,
      title: "Amber",
      desc: "Caution, attention, warning icons",
    },
  ];

  guidelines.forEach((guide, idx) => {
    const y = 1.3 + idx * 0.85;

    slide.addShape(pres.ShapeType.rect, {
      x: 0.5,
      y: y,
      w: 0.3,
      h: 0.3,
      fill: { color: guide.color },
      line: { type: "none" },
    });

    addTextBox(slide, guide.title, {
      x: 1.0,
      y: y,
      fontSize: 12,
      bold: true,
      color: guide.color,
    });

    addTextBox(slide, guide.desc, {
      x: 1.0,
      y: y + 0.3,
      w: 8.5,
      fontSize: 11,
      color: colors.textSecondary,
    });
  });

  // Bottom note
  addCodeBox(
    slide,
    "Purple/Cyan/Orange reserved for code syntax only. Dark backgrounds required. Monospace for headings.",
    {
      x: 0.5,
      y: 4.9,
      w: 9,
      fontSize: 10,
      color: colors.textMuted,
    }
  );
}

// ============================================================================
// SLIDE 17: CLOSING
// ============================================================================
{
  const slide = pres.addSlide();
  addDarkBg(slide);

  // Center logo
  slide.addText("magnetiz", {
    x: 2.5,
    y: 1.8,
    w: 3,
    fontFace: "Consolas",
    fontSize: 52,
    bold: true,
    color: colors.textPrimary,
    align: "center",
    margin: 0,
  });

  slide.addText(".ai", {
    x: 5.2,
    y: 1.8,
    w: 1.5,
    fontFace: "Consolas",
    fontSize: 52,
    bold: true,
    color: colors.steelBlue,
    align: "center",
    margin: 0,
  });

  // Thin line
  slide.addShape(pres.ShapeType.rect, {
    x: 2,
    y: 2.5,
    w: 6,
    h: 0.02,
    fill: { color: colors.steelBlue },
    line: { type: "none" },
  });

  // Version and contact
  addTextBox(slide, "Brand Guide v1.0 — February 2026", {
    x: 0.5,
    y: 3.0,
    w: 9,
    fontSize: 12,
    color: colors.textSecondary,
    align: "center",
  });

  addTextBox(
    slide,
    "For questions about brand usage, contact the marketing team.",
    {
      x: 0.5,
      y: 3.4,
      w: 9,
      fontSize: 11,
      color: colors.textMuted,
      align: "center",
    }
  );
}

// Save presentation
const outputPath = "/sessions/beautiful-clever-fermi/mnt/magnetiz_new/Magnetiz_Brand_Guide.pptx";
pres.writeFile({ path: outputPath });
console.log("PPTX saved to: " + outputPath);
