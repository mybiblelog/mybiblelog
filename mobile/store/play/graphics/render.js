// Builds the slides in layout.json as absolutely positioned DOM, in the
// browser. Plain script (no build step): the page is served as-is by
// scripts/play/render-graphics.mjs.
//
// Coordinates are slide pixels. Images and shapes are placed by their centre so
// a rotation pivots in place; text boxes by their top-left so they wrap
// downward. A text box with a `height` shrinks its font until it fits, which is
// what lets a long German headline share a layout with a short English one.
//
// When everything is laid out, fonts loaded and images decoded, the page sets
// <body data-ready> — the capture script waits on that, never on a timeout.
// Problems are collected on window.__graphics so the script can report them.

(function () {
  const report = { warnings: [], errors: [] };
  window.__graphics = report;

  const params = new URLSearchParams(location.search);
  const locale = params.get("locale") || "en-US";
  const onlySlide = params.get("slide");

  const MIN_FIT_RATIO = 0.5;

  main().catch((error) => {
    report.errors.push(String(error && error.message ? error.message : error));
    finish();
  });

  async function main() {
    const [layout, locales] = await Promise.all([getJson("/layout.json"), getJson("/locales.json")]);
    const current = locales.locales.find((entry) => entry.play === locale);
    if (!current) throw new Error(`Unknown locale "${locale}".`);

    const [strings, fallback] = await Promise.all([
      getJson(`/strings/${locale}.json`),
      getJson(`/strings/${locales.defaultLanguage}.json`),
    ]);
    const translate = (key) => {
      if (key in strings) return strings[key];
      if (key in fallback) {
        report.warnings.push(`${locale}: "${key}" is not translated; using ${locales.defaultLanguage}.`);
        return fallback[key];
      }
      report.errors.push(`${locale}: no text for "${key}" in any locale.`);
      return null;
    };

    await Promise.all((layout.fonts || []).map(loadStylesheet));

    let slides = layout.slides;
    if (onlySlide) {
      slides = slides.filter((slide) => slide.id === onlySlide);
      if (slides.length === 0) throw new Error(`No slide "${onlySlide}" in layout.json.`);
    }

    const ctx = { defaults: layout.defaults || {}, app: current.app, translate };
    const built = slides.map((slide) => ({ slide, el: buildSlide(slide, ctx) }));

    if (onlySlide) {
      document.body.className = "capture";
      document.body.append(built[0].el);
    } else {
      renderPreview(built, locales, current);
    }

    // Fonts only start loading once text that uses them is laid out.
    void document.body.offsetHeight;
    await document.fonts.ready;
    for (const { el } of built) el.querySelectorAll(".text[data-fit]").forEach(fitText);

    await Promise.all(
      [...document.querySelectorAll(".slide img")].map((img) =>
        img.decode().catch(() => report.errors.push(`Could not load ${decodeURI(img.getAttribute("src"))}`))
      )
    );

    finish();
  }

  function finish() {
    if (!onlySlide) showMessages();
    document.body.dataset.ready = "1";
  }

  async function getJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
  }

  function loadStylesheet(href) {
    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = () => {
        report.warnings.push(`Could not load font stylesheet ${href} (offline?); falling back to system fonts.`);
        resolve();
      };
      document.head.append(link);
    });
  }

  function buildSlide(slide, ctx) {
    const el = document.createElement("div");
    el.className = "slide";
    el.dataset.id = slide.id;
    Object.assign(el.style, {
      width: px(slide.size.width),
      height: px(slide.size.height),
      fontFamily: ctx.defaults.fontFamily || "sans-serif",
      color: ctx.defaults.color || "#000",
      ...backgroundStyle(slide.background || {}),
    });

    for (const shape of slide.shapes || []) el.append(buildShape(shape));
    for (const image of slide.images || []) el.append(buildImage(image, ctx));
    for (const text of slide.texts || []) el.append(buildText(text, ctx));
    return el;
  }

  /** Layers, top first: pattern, gradient, then the solid colour underneath. */
  function backgroundStyle({ color = "#ffffff", gradient, pattern }) {
    const layers = [];
    const sizes = [];
    if (pattern) {
      for (const layer of patternLayers(pattern)) {
        layers.push(layer.image);
        sizes.push(layer.size);
      }
    }
    if (gradient) {
      layers.push(gradient);
      sizes.push("auto");
    }
    return {
      backgroundColor: color,
      backgroundImage: layers.join(", "),
      backgroundSize: sizes.join(", "),
    };
  }

  function patternLayers({ type, color = "rgba(255,255,255,0.1)", size = 40, weight }) {
    const s = px(size);
    switch (type) {
      case "dots": {
        const r = weight ?? Math.max(2, size / 12);
        return [{ image: `radial-gradient(${color} ${px(r)}, transparent ${px(r + 0.5)})`, size: `${s} ${s}` }];
      }
      case "diagonal": {
        const w = weight ?? Math.max(2, size / 6);
        return [
          {
            image: `repeating-linear-gradient(45deg, ${color} 0 ${px(w)}, transparent ${px(w)} ${s})`,
            size: "auto",
          },
        ];
      }
      case "grid": {
        const w = weight ?? 2;
        return [
          { image: `linear-gradient(${color} ${px(w)}, transparent ${px(w)})`, size: `${s} ${s}` },
          { image: `linear-gradient(90deg, ${color} ${px(w)}, transparent ${px(w)})`, size: `${s} ${s}` },
        ];
      }
      default:
        report.errors.push(`Unknown background pattern "${type}" (use dots, diagonal or grid).`);
        return [];
    }
  }

  function buildShape(shape) {
    const el = document.createElement("div");
    const width = shape.width ?? shape.size;
    const height = shape.height ?? shape.size;
    Object.assign(el.style, {
      left: px(shape.x),
      top: px(shape.y),
      width: px(width),
      height: px(height),
      background: shape.color,
      borderRadius: shape.type === "circle" ? "50%" : px(shape.radius ?? 0),
      transform: centred(shape),
      zIndex: String(shape.z ?? 0),
      opacity: String(shape.opacity ?? 1),
      boxShadow: shape.shadow ? "0 18px 40px rgba(0,0,0,0.25)" : "none",
    });
    return el;
  }

  function buildImage(image, ctx) {
    const el = document.createElement("div");
    el.className = "image";
    const width = image.width;

    const img = document.createElement("img");
    if (image.asset) img.src = `/repo/${image.asset}`;
    else img.src = `/shots/${encodeURIComponent(ctx.app)}/${encodeURIComponent(image.src)}.png`;

    Object.assign(el.style, {
      left: px(image.x),
      top: px(image.y),
      width: px(width),
      transform: centred(image),
      zIndex: String(image.z ?? 0),
      opacity: String(image.opacity ?? 1),
    });

    if (image.frame) {
      // A plain CSS bezel: proportional to the phone's width so a small phone
      // in the feature graphic reads the same as a large one in a screenshot.
      const bezel = width * 0.025;
      Object.assign(el.style, {
        padding: px(bezel),
        background: image.frameColor || ctx.defaults.frameColor || "#15171c",
        borderRadius: px(width * 0.1),
      });
      img.style.borderRadius = px(width * 0.1 - bezel);
    } else if (image.radius) {
      img.style.borderRadius = px(image.radius);
    }

    if (image.shadow) {
      const blur = Math.round(width * 0.08);
      el.style.filter = `drop-shadow(0 ${px(blur / 2)} ${px(blur)} rgba(0,0,0,0.35))`;
    }

    el.append(img);
    return el;
  }

  function buildText(text, ctx) {
    const el = document.createElement("div");
    el.className = "text";
    const value = ctx.translate(text.key);
    if (value === null) el.classList.add("missing");
    el.textContent = value ?? `[${text.key}]`;
    el.dataset.key = text.key;

    Object.assign(el.style, {
      left: px(text.x),
      top: px(text.y),
      width: px(text.width),
      fontSize: px(text.size),
      fontWeight: String(text.weight ?? 400),
      fontStyle: text.style ?? "normal",
      fontFamily: text.font ?? "",
      color: text.color ?? "",
      textAlign: text.align ?? "left",
      lineHeight: String(text.lineHeight ?? 1.2),
      letterSpacing: text.letterSpacing ?? "normal",
      textTransform: text.textTransform ?? "none",
      opacity: String(text.opacity ?? 1),
      zIndex: String(text.z ?? 10),
      textShadow: text.shadow ? "0 4px 18px rgba(0,0,0,0.3)" : "none",
    });

    if (text.height) {
      el.dataset.fit = String(text.height);
      el.dataset.size = String(text.size);
    }
    return el;
  }

  /** Steps the font size down until the box's content fits its `height`. */
  function fitText(el) {
    const maxHeight = Number(el.dataset.fit);
    const base = Number(el.dataset.size);
    let size = base;
    while (el.scrollHeight > maxHeight && size > base * MIN_FIT_RATIO) {
      size -= 2;
      el.style.fontSize = px(size);
    }
    if (el.scrollHeight > maxHeight) {
      report.errors.push(`${locale}: "${el.dataset.key}" does not fit its ${maxHeight}px box even at ${size}px.`);
      el.classList.add("missing");
    } else if (size !== base) {
      report.warnings.push(`${locale}: "${el.dataset.key}" shrunk from ${base}px to ${size}px to fit.`);
    }
  }

  function centred(item) {
    const parts = ["translate(-50%, -50%)"];
    if (item.rotateX || item.rotateY) {
      parts.push(`perspective(${px(item.perspective ?? 2400)})`);
      if (item.rotateX) parts.push(`rotateX(${item.rotateX}deg)`);
      if (item.rotateY) parts.push(`rotateY(${item.rotateY}deg)`);
    }
    if (item.rotate) parts.push(`rotate(${item.rotate}deg)`);
    return parts.join(" ");
  }

  function px(value) {
    return `${value}px`;
  }

  function renderPreview(built, locales, current) {
    document.body.className = "preview";

    const toolbar = document.createElement("div");
    toolbar.className = "toolbar";
    const select = document.createElement("select");
    for (const entry of locales.locales) {
      const option = new Option(`${entry.play} (screenshots: ${entry.app})`, entry.play);
      option.selected = entry.play === current.play;
      select.append(option);
    }
    select.onchange = () => {
      location.search = `?locale=${encodeURIComponent(select.value)}`;
    };
    toolbar.append("Locale:", select, "Reload after editing layout.json or graphics.json.");
    document.body.append(toolbar);

    const messages = document.createElement("div");
    messages.className = "messages";
    document.body.append(messages);

    const grid = document.createElement("div");
    grid.className = "grid";
    const PREVIEW_HEIGHT = 640;
    for (const { slide, el } of built) {
      const scale = Math.min(PREVIEW_HEIGHT / slide.size.height, 1);
      const cell = document.createElement("figure");
      cell.className = "cell";
      cell.style.margin = "0";
      const box = document.createElement("div");
      box.style.width = px(slide.size.width * scale);
      box.style.height = px(slide.size.height * scale);
      const scaler = document.createElement("div");
      scaler.className = "scaler";
      scaler.style.transform = `scale(${scale})`;
      scaler.append(el);
      box.append(scaler);
      const caption = document.createElement("figcaption");
      caption.textContent = `${slide.id} — ${slide.size.width}×${slide.size.height}`;
      cell.append(box, caption);
      grid.append(cell);
    }
    document.body.append(grid);
  }

  function showMessages() {
    const el = document.querySelector(".messages");
    if (!el) return;
    const lines = [...report.errors.map((e) => `✗ ${e}`), ...report.warnings.map((w) => `! ${w}`)];
    el.textContent = lines.join("\n");
    if (report.errors.length > 0) el.classList.add("error");
  }
})();
