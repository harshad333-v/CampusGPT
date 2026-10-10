from pathlib import Path

from app.rag.preprocessors.timetable_parser import parse_timetable


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"


def main():
    files = list(DATA_DIR.glob("*.pdf"))

    if not files:
        raise FileNotFoundError("No PDF found in data/")

    file_path = files[0]

    records = parse_timetable(str(file_path))

    print("=" * 70)
    print(f"FILE: {file_path.name}")
    print("=" * 70)
    print(f"Timetable records: {len(records)}")

    for index, record in enumerate(records):
        print("\n" + "-" * 70)
        print(f"RECORD {index + 1}")
        print("-" * 70)
        print(record.page_content)
        print("\nMetadata:")
        print(record.metadata)


if __name__ == "__main__":
    main()