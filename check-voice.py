#!/usr/bin/env python3
"""Check custom voice clips and update manifest.json."""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent / "audio" / "custom"
MANIFEST = ROOT / "manifest.json"

FILES = [
    ("good-job.m4a", 'Good job, Allyson!'),
    ("amazing.m4a", 'Amazing, Allyson!'),
    ("thats-right.m4a", "That's right, Allyson!"),
    ("math-star.m4a", "You're a math star, Allyson!"),
    ("fantastic.m4a", 'Fantastic, Allyson!'),
    ("great-work.m4a", 'Great work, Allyson!'),
    ("brilliant.m4a", 'Brilliant, Allyson!'),
    ("you-got-it.m4a", 'You got it, Allyson!'),
    ("nice-try.m4a", 'Nice try, Allyson! You can do it!'),
    ("keep-going.m4a", 'Keep going, Allyson!'),
    ("almost.m4a", 'Almost, Allyson! Try again!'),
    ("incredible.m4a", 'Incredible, Allyson! You did it!'),
    ("wow-champion.m4a", 'Wow Allyson, you are a champion!'),
    ("super-job.m4a", 'Super job, Allyson!'),
    ("pop-good.m4a", 'Pop! Good job, Allyson!'),
    ("nice-pop.m4a", 'Nice pop, Allyson!'),
    ("bubble-great.m4a", 'Bubble burst! Great job!'),
    ("fuel-up.m4a", 'Fuel up, Allyson!'),
    ("go-go.m4a", 'Go Allyson go!'),
    ("rocket-power.m4a", 'Rocket power, Allyson!'),
    ("unlocked.m4a", 'Awesome Allyson! You unlocked a new table!'),
    ("moon.m4a", 'You reached the moon, Allyson! You are a superstar!'),
]

def main():
    print("Custom voice checklist\n")
    done = 0
    for name, phrase in FILES:
        ok = (ROOT / name).exists()
        done += ok
        mark = "✅" if ok else "⬜"
        print(f"{mark} {name}\n    Say: \"{phrase}\"\n")
    print(f"Progress: {done}/{len(FILES)}")
    found = [name for name, _ in FILES if (ROOT / name).exists()]
    MANIFEST.write_text(json.dumps(found, indent=2) + "\n")
    js_path = Path(__file__).resolve().parent / "js" / "custom-manifest.js"
    js_path.write_text(
        "window.CUSTOM_VOICE_FILES = " + json.dumps(found, indent=2) + ";\n"
    )
    print(f"\nUpdated manifest.json with {len(found)} file(s).")
    if found:
        print("Turn on Family Voice in the game to use your recordings.")

if __name__ == "__main__":
    main()
