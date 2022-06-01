canvas_height = 600
canvas_width = 1000

function getIdNumber() {
    let x = Math.floor((Math.random() * 10000));
    if (x < 1000) {
        x = x + 1000
    }
    return x
}

function getGrabcutCanvasId(id, canvas_num) {
    return "grabcut_" + id + "_canvas_" + canvas_num
}

function makeProbableForegroundFabricCanvas(myCanvasObj, appendToCol) {
    let canvas1_id = myCanvasObj.id
    myCanvasObj.ready = false;
    let canvas_html = $("<canvas>")
    $(canvas_html).attr("id", myCanvasObj.id)
    $(canvas_html).attr("height", canvas_height)
    $(canvas_html).attr("width", canvas_width)
    $(appendToCol).append(canvas_html)

    var canvas = new fabric.Canvas(canvas1_id);

    fabric.Image.fromURL(myCanvasObj.imageURL, function (img) {
        let original_height = img._originalElement.height
        let original_width = img._originalElement.width

        let max_dimension = Math.max(original_height, original_width)

        let scale_determine = original_height > original_width ? original_height : original_width
        let scale_factor = 1000 / scale_determine

        myCanvasObj.scale_factor = scale_factor
        myCanvasObj.img = img
        myCanvasObj.img_height = original_height * scale_factor
        myCanvasObj.img_width = original_width * scale_factor

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            scaleX: scale_factor,
            scaleY: scale_factor,
        });
    });

    var rect, isDown, origX, origY;
    var hasRect = false

    canvas.on('mouse:down', function (o) {
        if (hasRect) {
            return;
        }

        isDown = true;
        var pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        var pointer = canvas.getPointer(o.e);
        rect = new fabric.Rect({
            left: origX,
            top: origY,
            originX: 'left',
            originY: 'top',
            width: pointer.x - origX,
            height: pointer.y - origY,
            angle: 0,
            fill: 'rgba(0,255,0,0.5)',
            transparentCorners: false,
            hasRotatingPoint: false,
        });
        canvas.add(rect);
    });

    canvas.on('mouse:move', function (o) {
        if (hasRect) return;

        if (!isDown) return;
        var pointer = canvas.getPointer(o.e);

        if (origX > pointer.x) {
            rect.set({ left: Math.abs(pointer.x) });
        }
        if (origY > pointer.y) {
            rect.set({ top: Math.abs(pointer.y) });
        }

        rect.set({ width: Math.abs(origX - pointer.x) });
        rect.set({ height: Math.abs(origY - pointer.y) });


        canvas.renderAll();
    });

    canvas.on('mouse:up', function (o) {
        if (hasRect) return;
        isDown = false;
        canvas.getActiveObject().setCoords()
        canvas.renderAll();

        hasRect = true
        myCanvasObj.ready = true
    });

    return canvas


}


function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    console.log(sURLVariables)
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function makeTrackingTask(appending_container, project_name) {

    let id = GetURLParameter('id_video')
    console.log(id)
    if (id == null) {
        id = getIdNumber()
    }
    let upload = $("<div class='title'>")
    $("#" + appending_container).append(upload)

    $(upload).append("<div>id=" + id + "</div>")
    document.getElementById('id_video').value = id
    imageURL = '../static/data/' + id + '/preview.jpg'
    let obj = {
        id: id,
        row_type: "tracking",
        project_name: project_name,
        image: {
            imageURL: imageURL,
            scale_factor: 1,
            height: "",
            width: "",
            original_image: "",
        },
        canvas1: {},
    }

    let new_row = $("<div class='row tracking_row'>")
    let col1 = $("<div class='col-lg-3'>")

    $(new_row).append(col1)
    $("#" + appending_container).append(new_row)

    let title_container = $("<div class='col-md-12'>")
    let title_row = $("<div class='row'>")
    let title1 = $("<div class='col-lg-3'>")

    $(title1).append("<div class='title'>Выделите объект для слежения</div>")
    $(title_container).append(title_row)
    $(new_row).prepend(title_container)

    let canvas1_id = getGrabcutCanvasId(id, "1")
    obj.canvas1 = {
        type: "fabric_canvas",
        id: canvas1_id,
        imageURL: imageURL,
        scale_factor: 1,
        img_height: "",
        img_width: "",
        original_image: "",

    }


    $


    var fg_fabric_canvas = makeProbableForegroundFabricCanvas(obj.canvas1, col1)

    let do_grabcut_button = $("<button class='btn btn-primary'>Начать отслеживание</button>")
    $(col1).append(do_grabcut_button)
    $(do_grabcut_button).click(function () {
        if (!obj.canvas1.ready) {
            alert("Please draw a rectangle")
            return
        }

        var rect_1 = get_active_rect_of_canvas(fg_fabric_canvas)
        rect_1.scale_factor = obj.canvas1.scale_factor

        let row_id = id
        do_tracking_backend(imageURL.replace("preview.jpg", "video.mp4"), rect_1, col1, appending_container, obj)
    })

    return obj
}

function get_active_rect_of_canvas(fabric_canvas) {
    let active = fabric_canvas.getActiveObject()
    if (active) {
        let left = active.left
        let top = active.top
        let width = active.width * active.scaleX
        let height = active.height * active.scaleY

        return {
            'left': left,
            'top': top,
            'width': width,
            'height': height
        }
    } else {
        console.log("no Fabric rect")
    }
    return {}
}


function do_tracking_backend(video_file, rect_coords, where, div_id, obj) {
    $(where).empty()
    var loading_img = $("<div id='loading_" + div_id + "'>")
    $(loading_img).append("<img src='../static/ajax-loader.gif'>")
    $(loading_img).addClass('loading_gif')
    $(where).append(loading_img)
    var send = {
        'video_file': video_file,
        'project_name': obj.project_name,
        'row_id': obj.id,
        'rect_coords': rect_coords,
    }
    $("#loading_" + div_id).remove()
    var gc_img = $("<img>")
    $(gc_img).attr('src', "../video?id_video=" + obj.id + "&rect_coords=" + JSON.stringify(rect_coords))
    $(where).empty()
    $(where).append(gc_img)
}


function clear_canvas(canvas) {
    var objects = canvas.getObjects()
    for (var i = 0; i < objects.length; i++) {
        canvas.remove(objects[i])
    }
}
