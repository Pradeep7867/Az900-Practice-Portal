import json
from pathlib import Path

old = json.loads(
    Path("data/questions.json").read_text()
)

new = json.loads(
    Path("az900-phase3-phase4-questions.json").read_text()
)

# Replace only Episodes 19–39.
phase_3_4 = {
    f"ep-{i:02d}" for i in range(19, 40)
}

old["questions"] = [
    q for q in old["questions"]
    if q["episodeId"] not in phase_3_4
]

old["questions"].extend(new["questions"])

Path("data/questions.json").write_text(
    json.dumps(old, indent=2, ensure_ascii=False)
)

print("Phase 3 and Phase 4 imported successfully!")