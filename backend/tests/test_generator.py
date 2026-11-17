from fixture_data import generate


def test_deterministic():
    assert generate(25, 1, 471) == generate(25, 1, 471)


def test_shape_25():
    d = generate(25, 1, 471)
    assert len(d["trainsets"]) == 25
    assert len(d["certificates"]) == 75
    assert {t["bay_id"] for t in d["trainsets"]} <= {b["bay_id"] for b in d["bays"]}


def test_two_depots_40():
    d = generate(40, 2, 471)
    assert len(d["trainsets"]) == 40
    assert {t["depot_id"] for t in d["trainsets"]} == {"D1", "D2"}
