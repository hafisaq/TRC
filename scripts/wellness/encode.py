#!/usr/bin/env python3
"""Encode the curated wellness media for Sanity.

Reads manifest.json (beside this script):
  {
    "<slug>": {
      "lead": [["<file>", start, end], ...],      # segments concatenated into the lead film
      "poster": "<image file>" | "frame:<seconds>",
      "gallery": ["<image file>", ...],
      "galleryFilms": [[["<file>", start, end], ...], ...]   # each inner list = one gallery film
    }
  }
Writes _out/<slug>/... and _out/manifest-out.json (what to upload).
Every film: 1920x1080 h264 crf 22 maxrate 3M faststart, muted; plus a 720p copy.
Letterbox bars are detected with cropdetect and removed before scaling.
"""
import json, os, subprocess, sys, re

# media (gitignored) lives in source-media/wellness; the curated picks live here
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..", "source-media", "wellness")
OUT = os.path.join(ROOT, "_out")
FF = ["ffmpeg", "-v", "error", "-y"]

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("FAILED:", " ".join(cmd)); print(r.stderr[-2000:]); sys.exit(1)

def cropdetect(src, start):
    r = subprocess.run(["ffmpeg", "-ss", str(start), "-t", "4", "-i", src, "-vf", "cropdetect=24:16:0", "-f", "null", "-"], capture_output=True, text=True)
    crops = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", r.stderr)
    if not crops: return None
    w, h, x, y = map(int, crops[-1])
    probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", src], capture_output=True, text=True).stdout)
    sw, sh = int(probe["streams"][0]["width"]), int(probe["streams"][0]["height"])
    # only honour a real letterbox/pillarbox (bars of at least 4% on an axis)
    if (sh - h) / sh >= 0.04 or (sw - w) / sw >= 0.04:
        return f"crop={w}:{h}:{x}:{y}"
    return None

def encode_film(segments, dest, width, height, crf, maxrate, bufsize):
    inputs, filters, labels = [], [], []
    for i, (f, start, end) in enumerate(segments):
        src = os.path.join(ROOT, f)
        inputs += ["-i", src]
        crop = cropdetect(src, start)
        chain = f"[{i}:v]trim=start={start}:end={end},setpts=PTS-STARTPTS"
        if crop: chain += "," + crop
        chain += f",scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},fps=25,format=yuv420p[v{i}]"
        filters.append(chain); labels.append(f"[v{i}]")
    fc = ";".join(filters) + f";{''.join(labels)}concat=n={len(segments)}:v=1:a=0[out]"
    run(FF + inputs + ["-filter_complex", fc, "-map", "[out]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
                       "-maxrate", maxrate, "-bufsize", bufsize, "-movflags", "+faststart", dest])

def frame(src, t, dest):
    run(FF + ["-ss", str(t), "-i", src, "-frames:v", "1", "-q:v", "3", dest])

def still(src, dest, maxw=2400):
    run(FF + ["-i", src, "-vf", f"scale='min({maxw},iw)':-2", "-q:v", "3", dest])

def main():
    only = sys.argv[1:]
    manifest = json.load(open(os.path.join(HERE, "manifest.json")))
    result = json.load(open(os.path.join(OUT, "manifest-out.json"))) if os.path.exists(os.path.join(OUT, "manifest-out.json")) else {}
    for slug, m in manifest.items():
        if only and slug not in only: continue
        d = os.path.join(OUT, slug); os.makedirs(d, exist_ok=True)
        entry = {"lead": {}, "gallery": []}
        lead = os.path.join(d, f"{slug}-lead.mp4"); lead720 = os.path.join(d, f"{slug}-lead-720.mp4")
        print(f"[{slug}] lead film from {len(m['lead'])} segment(s)")
        encode_film(m["lead"], lead, 1920, 1080, 22, "3M", "6M")
        encode_film(m["lead"], lead720, 1280, 720, 24, "1600k", "3200k")
        poster = os.path.join(d, f"{slug}-lead.jpg")
        if m["poster"].startswith("frame:"):
            frame(lead, float(m["poster"][6:]), poster)
        else:
            still(os.path.join(ROOT, m["poster"]), poster)
        entry["lead"] = {"film": lead, "film720": lead720, "poster": poster}
        for i, img in enumerate(m.get("gallery", [])):
            dest = os.path.join(d, f"{slug}-g{i+1:02d}.jpg")
            still(os.path.join(ROOT, img), dest)
            entry["gallery"].append({"poster": dest})
        for i, segs in enumerate(m.get("galleryFilms", [])):
            base = os.path.join(d, f"{slug}-f{i+1:02d}")
            print(f"[{slug}] gallery film {i+1}")
            encode_film(segs, base + ".mp4", 1920, 1080, 22, "3M", "6M")
            encode_film(segs, base + "-720.mp4", 1280, 720, 24, "1600k", "3200k")
            frame(base + ".mp4", 0.6, base + ".jpg")
            entry["gallery"].append({"poster": base + ".jpg", "film": base + ".mp4", "film720": base + "-720.mp4"})
        result[slug] = entry
        json.dump(result, open(os.path.join(OUT, "manifest-out.json"), "w"), indent=1)
        print(f"[{slug}] done: {len(entry['gallery'])} gallery items")

main()
