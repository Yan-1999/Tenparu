var Stage;
(function (Stage) {
    Stage[Stage["Backlog"] = 0] = "Backlog";
    Stage[Stage["Todo"] = 1] = "Todo";
    Stage[Stage["Doing"] = 2] = "Doing";
    Stage[Stage["Verify"] = 3] = "Verify";
    Stage[Stage["Done"] = 4] = "Done";
})(Stage || (Stage = {}));
var STROAGE_KEY = 'tenparu';
var task_template = document.getElementById('task-template');
var task_list = document.getElementById('task-list');
var curStage = Stage.Doing;
var tasks = {};
function taskAncestorElement(elem) {
    var e = elem;
    while (e !== document.body) {
        if (e.classList.contains('task')) {
            return (e);
        }
        e = e.parentElement;
    }
    return null;
}
function diffTimeStr(datetime) {
    var diff = Date.now() - datetime.getTime();
    var suffix = 'passed';
    if (diff < 0) {
        diff = -diff;
        suffix = 'left';
    }
    if (diff > 86400000) {
        return [Math.floor(diff / 86400000).toString(),
            'days',
            suffix].join(' ');
    }
    else if (diff > 3600000) {
        return [Math.floor(diff / 3600000).toString(),
            'hours',
            suffix].join(' ');
    }
    else {
        return [Math.floor(diff / 60000).toString(),
            'minutes',
            suffix].join(' ');
    }
}
function writeBack() {
    window.localStorage.setItem(STROAGE_KEY, JSON.stringify(tasks));
}
var Task = /** @class */ (function () {
    function Task(name, due, priority, description, stage) {
        this.progress = 0;
        this.name = name;
        this.due = due;
        this.priority = priority;
        this.description = description;
        this.stage = stage;
    }
    Task.prototype.renderDiv = function (div) {
        div.setAttribute('data-name', this.name);
        div.getElementsByClassName('task-item-name')[0].textContent = this.name;
        div.getElementsByClassName('task-item-due')[0].textContent = this.due.toLocaleString();
        div.getElementsByClassName('task-item-priority')[0].textContent = this.priority;
        div.getElementsByClassName('task-item-description')[0].textContent = this.description;
        div.getElementsByClassName('task-item-timeleft')[0].textContent = diffTimeStr(this.due);
        div.getElementsByClassName('task-item-delete')[0].onclick = this.remove.bind(this);
        var next_button = div.getElementsByClassName('task-item-next')[0];
        var range = div.getElementsByClassName('task-item-progress')[0];
        var stage = this.stage;
        if (stage === Stage.Done) {
            next_button.style.display = 'none';
            range.style.display = 'none';
            div.setAttribute('data-done', '');
        }
        else {
            next_button.textContent = Stage[stage + 1];
            next_button.onclick = this.advanceStage.bind(this);
            range.onchange = this.setProgress.bind(this);
            range.value = this.progress.toString();
            if (range.value === range.max) {
                div.setAttribute('data-done', '');
            }
        }
    };
    Task.prototype.newDiv = function () {
        var node = task_template.content.querySelector('.task');
        var new_node = document.importNode(node, true);
        this.renderDiv(new_node);
        return new_node;
    };
    Task.prototype.remove = function (ev) {
        var div = taskAncestorElement(ev.target);
        div.remove();
        delete tasks[this.name];
        writeBack();
    };
    Task.prototype.setProgress = function (ev) {
        var range = ev.target;
        var val = range.value;
        this.progress = Number.parseInt(val);
        var task_div = taskAncestorElement(range);
        if (range.value === range.max) {
            task_div.setAttribute('data-done', '');
        }
        else {
            task_div.removeAttribute('data-done');
        }
        writeBack();
    };
    Task.prototype.setStage = function (ev, stage) {
        var div = taskAncestorElement(ev.target);
        div.remove();
        this.stage = stage;
        writeBack();
    };
    Task.prototype.advanceStage = function (ev) {
        this.setStage(ev, this.stage + 1);
    };
    return Task;
}());
function addTask(ev) {
    var form = ev.target;
    var data = new FormData(form);
    var name = data.get('task-name').toString();
    if (name in tasks) {
        alert("Task with the name already exits!");
        return false;
    }
    var new_task = new Task(name, new Date([
        data.get('due-date').toString(),
        data.get('due-time').toString(),
    ].join(' ')), data.get('priority').toString(), data.get('description').toString(), Stage.Doing);
    tasks[name] = new_task;
    writeBack();
    var div = new_task.newDiv();
    task_list.appendChild(div);
    return false;
}
function loadTaskList(stage) {
    task_list.innerHTML = '';
    for (var key in tasks) {
        var task = tasks[key];
        if (task.stage === stage) {
            task_list.appendChild(task.newDiv());
        }
    }
}
function load() {
    if (tasks_str !== null) {
        var raw_list = JSON.parse(window.localStorage.getItem(STROAGE_KEY));
        for (var key in raw_list) {
            var raw = raw_list[key];
            raw.due = new Date(raw.due);
            var task = tasks[key] = new Task();
            Object.assign(task, raw);
        }
    }
}
function changeStage(stage) {
    loadTaskList(stage);
    for (var index = 0; index <= Stage.Done; index++) {
        var elem = document.getElementById(['stage-',
            Stage[index].toLowerCase()].join(''));
        if (index === stage) {
            elem.setAttribute('data-current', '');
        }
        else {
            elem.removeAttribute('data-current');
        }
    }
    curStage = stage;
}
function doneAllCurStage() {
    for (var key in tasks) {
        var task = tasks[key];
        if (task.stage === curStage) {
            task.stage = Stage.Done;
        }
    }
}
/*main*/
document.getElementById('new-task').onsubmit = addTask;
var stages_div = document.getElementById('stages');
for (var index = 0; index <= Stage.Done; index++) {
    var stage_str = Stage[index];
    var anchor = document.createElement('button');
    anchor.id = ['stage-', stage_str.toLowerCase()].join('');
    anchor.textContent = stage_str;
    anchor.onclick = changeStage.bind(null, index);
    stages_div.appendChild(anchor);
}
var tasks_str = window.localStorage.getItem(STROAGE_KEY);
if (tasks_str !== null) {
    tasks = JSON.parse(window.localStorage.getItem(STROAGE_KEY));
}
load();
changeStage(curStage);
