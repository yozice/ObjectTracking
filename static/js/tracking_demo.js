$(document).ready(function () {
    console.log('doc ready')
    all_rows = {} // id: objc
    appending_container = "appending_container"

    project_name = "tracker"
    let obj1 = makeTrackingTask(appending_container, project_name)
    let obj1_id = obj1.id
    all_rows[obj1_id] = obj1
})