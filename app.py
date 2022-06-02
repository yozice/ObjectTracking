import json
import os
import shutil

import cv2
from flask import Flask, Response, redirect, render_template, request, url_for

from tracking import detect_object, read_video

tmpl_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")

app = Flask(__name__, template_folder=tmpl_dir)
UPLOAD_DIR = "./static/data"


def generate_first_frame(path):
    camera = read_video(path)
    success, frame = camera.read()
    if not success:
        return None

    _, buffer = cv2.imencode(".jpg", frame)

    frame = buffer.tobytes()
    return frame


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/", methods=["GET", "POST"])
def upload_file():
    if request.method == "POST":
        request_file = request.files.get("file")
        id_video = request.form["id_video"]
        dir_id = f"{UPLOAD_DIR}/{id_video}"
        try:
            shutil.rmtree(dir_id)
        except OSError:
            pass
        os.mkdir(dir_id)
        path = f"{dir_id}/video.mp4"
        request_file.save(path)
        first_frame = generate_first_frame(path)

        with open(f"{dir_id}/preview.jpg", "wb") as file:
            file.write(first_frame)

        return redirect(url_for("index", id_video=id_video))
    return redirect(url_for("index"))


@app.route("/video", methods=["GET", "POST"])
def video():
    row_id = request.args.get("id_video")
    rect_coords = json.loads(request.args.get("rect_coords"))
    video_file = f"{UPLOAD_DIR}/{row_id}/video.mp4"
    return Response(
        detect_object(video_file, rect_coords),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
