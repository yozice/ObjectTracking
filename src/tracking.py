import time

import cv2


def resize_frame(frame, factor):
    width = int(frame.shape[1] * factor)
    height = int(frame.shape[0] * factor)
    dim = (width, height)
    resized = cv2.resize(frame, dim, interpolation=cv2.INTER_AREA)
    return resized


def read_video(path):
    camera = cv2.VideoCapture(path)
    return camera


def get_bbox(rect):
    bbox = tuple(
        map(
            int,
            [
                rect["left"],
                rect["top"],
                rect["width"],
                rect["height"],
            ],
        )
    )
    return bbox


def init_tracker(tracker_type):
    if tracker_type == "KCF":
        tracker = cv2.TrackerKCF_create()
    elif tracker_type == "MOSSE":
        tracker = cv2.legacy.TrackerMOSSE_create()
    elif tracker_type == "GOTURN":
        tracker = cv2.TrackerGOTURN_create()
    else:
        tracker = None
    return tracker


def detect_object(path, rect_coords):
    tracker = init_tracker("MOSSE")
    scale_factor = rect_coords["scale_factor"]
    video = read_video(path)

    _, frame = video.read()
    frame = resize_frame(frame, scale_factor)

    bbox = get_bbox(rect_coords)

    is_tracker_inited = tracker.init(frame, bbox)

    while True:
        _, frame = video.read()
        frame = resize_frame(frame, scale_factor)

        timer = cv2.getTickCount()

        is_tracker_inited, bbox = tracker.update(frame)

        fps = cv2.getTickFrequency() / (cv2.getTickCount() - timer)

        if is_tracker_inited:
            left_top_coord = (int(bbox[0]), int(bbox[1]))
            right_bot_coord = (int(bbox[0] + bbox[2]), int(bbox[1] + bbox[3]))
            cv2.rectangle(frame, left_top_coord, right_bot_coord, (255, 0, 0), 2, 1)
        else:
            cv2.putText(
                frame,
                "Tracking failure detected",
                (100, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (0, 0, 255),
                2,
            )

        # Display FPS on frame
        cv2.putText(
            frame,
            "FPS : " + str(int(fps)),
            (100, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.75,
            (50, 170, 50),
            2,
        )

        _, buffer = cv2.imencode(".jpg", frame)

        frame = buffer.tobytes()

        yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
        time.sleep(0.01)
