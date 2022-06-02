from typing import Tuple

import cv2
import pytest
from src.tracking import get_bbox, init_tracker


@pytest.fixture(
    scope="function", params=[({"left": 0, "top": 10, "width": 10, "height": 10})]
)
def rect_coords(request):
    return request.param


def test_get_bbox(rect_coords):
    bbox = get_bbox(rect_coords)
    assert len(bbox) == 4


@pytest.mark.parametrize(
    "tracker_type, expected_class",
    [("KCF", cv2.TrackerKCF), ("MOSSE", cv2.legacy_TrackerMOSSE)],
)
def test_init_tracker(tracker_type, expected_class):
    tracker = init_tracker(tracker_type)
    assert isinstance(tracker, expected_class)
