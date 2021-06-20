var Stage;
(function (Stage) {
    Stage[Stage["Backlog"] = 0] = "Backlog";
    Stage[Stage["Todo"] = 1] = "Todo";
    Stage[Stage["InProgress"] = 2] = "InProgress";
    Stage[Stage["Verify"] = 3] = "Verify";
    Stage[Stage["Done"] = 4] = "Done";
})(Stage || (Stage = {}));
var STROAGE_KEY = 'tenparu';
var taskTemplate = document.getElementById('task-template').content.querySelector('.task');
var curStage = Stage.InProgress;
/**
 * `Date.now()`
 * @param datetime time
 * @returns str rep of time difference
 */
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
/**
 * Task Class
 */
var Task = /** @class */ (function () {
    function Task(name, due, priority, description, stage) {
        this.progress = 0;
        this.name = name;
        this.due = due;
        this.priority = priority;
        this.description = description;
        this.stage = stage;
    }
    /**
     * Load Task.tasks form `localStorage` to `Task.tasks`.
     */
    Task.load = function () {
        var tasksStr = window.localStorage.getItem(STROAGE_KEY);
        if (tasksStr !== null) {
            var raw_list = JSON.parse(tasksStr);
            for (var key in raw_list) {
                var raw = raw_list[key];
                raw.due = new Date(raw.due);
                var task = Task.tasks[key] = new Task();
                Object.assign(task, raw);
            }
        }
    };
    /**
     * Write `Task.tasks` to `localStorage`.
     */
    Task.store = function () {
        window.localStorage.setItem(STROAGE_KEY, JSON.stringify(Task.tasks));
    };
    Task.prototype.setProgress = function (val) {
        this.progress = val;
        Task.store();
    };
    /**
     * Set `this.stage`.
     * IGNORE OUT OF RANGE ERROR.
     * @param stage stage to change to
     */
    Task.prototype.setStage = function (stage) {
        this.stage = stage;
        Task.store();
    };
    Task.insert = function (task) {
        Task.tasks[task.name] = task;
        Task.store();
    };
    Task.erase = function (task) {
        delete Task.tasks[task.name];
        Task.store();
    };
    Task.tasks = {};
    return Task;
}());
var TaskView = /** @class */ (function () {
    /**
     * USE `TaskView.create()` TO CREATE A VIEW.
     */
    function TaskView(div) {
        this._div = div;
    }
    /**
     * Render new `.task` div using `this`, and set events.
     * @param div div to render
     */
    TaskView.prototype._renderDiv = function (task) {
        this._div.setAttribute('data-name', task.name);
        this._div.getElementsByClassName('task-item-name')[0].textContent = task.name;
        this._div.getElementsByClassName('task-item-due')[0].textContent = task.due.toLocaleString();
        this._div.getElementsByClassName('task-item-priority')[0].textContent = task.priority;
        this._div.getElementsByClassName('task-item-description')[0].textContent = task.description;
        this._div.getElementsByClassName('task-item-timeleft')[0].textContent = diffTimeStr(task.due);
        this._next_button = this._div.getElementsByClassName('task-item-next')[0];
        this.range = this._div.getElementsByClassName('task-item-progress')[0];
        var stage = task.stage;
        if (stage === Stage.Done) {
            this._next_button.style.display = 'none';
            this.range.style.display = 'none';
            this._div.setAttribute('data-done', '');
        }
        else {
            this._next_button.textContent = Stage[stage + 1];
            this.range.value = task.progress.toString();
            if (this.range.value === this.range.max) {
                this._div.setAttribute('data-done', '');
            }
        }
    };
    TaskView.prototype._bindController = function (task) {
        var controller = new TaskController(task, this);
        this._div.getElementsByClassName('task-item-delete')[0].onclick = controller.erase.bind(controller);
        if (task.stage !== Stage.Done) {
            this._next_button.onclick = controller.advanceStage.bind(controller);
            this.range.onchange = controller.editProgress.bind(controller);
        }
    };
    TaskView.prototype.onProgressSet = function () {
        if (this.range.value === this.range.max) {
            this._div.setAttribute('data-done', '');
        }
        else {
            this._div.removeAttribute('data-done');
        }
    };
    TaskView.prototype.erase = function () {
        this._div.remove();
    };
    TaskView.createView = function (task) {
        var div = document.importNode(taskTemplate, true);
        var view = new TaskView(div);
        view._renderDiv(task);
        view._bindController(task);
        TaskView.taskList.appendChild(view._div);
        return view;
    };
    /**
     * Load Task.tasks of stage to current page.
     * @param stage stage loading
     */
    TaskView.loadView = function (stage) {
        TaskView.taskList.innerHTML = '';
        for (var key in Task.tasks) {
            var task = Task.tasks[key];
            if (task.stage === stage) {
                TaskView.createView(task);
            }
        }
    };
    /**
     * Change current stage.
     * @param stage stage changing to
     */
    TaskView.changeViewToStage = function (stage) {
        TaskView.loadView(stage);
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
    };
    TaskView.taskList = document.getElementById('task-list');
    return TaskView;
}());
var TaskController = /** @class */ (function () {
    function TaskController(task, view) {
        this._task = task;
        this._view = view;
    }
    TaskController.prototype.erase = function () {
        this._view.erase();
        Task.erase(this._task);
    };
    TaskController.prototype.editProgress = function () {
        var val = Number.parseInt(this._view.range.value);
        this._view.onProgressSet();
        this._task.setProgress(val);
    };
    TaskController.prototype.editStage = function (stage) {
        this._view.erase();
        this._task.setStage(stage);
    };
    /**
     * Equivalent to `editStage(this._task.stage + 1)`.
     */
    TaskController.prototype.advanceStage = function () {
        this.editStage(this._task.stage + 1);
    };
    /**
     * Add task to `Task.tasks` and write back.
     * @param ev event which target is a form
     * @returns false
     */
    TaskController.addTask = function (ev) {
        var form = ev.target;
        var data = new FormData(form);
        var name = data.get('task-name').toString();
        if (name in Task.tasks) {
            alert("Task with the name already exits!");
            return false;
        }
        var newTask = new Task(name, new Date([
            data.get('due-date').toString(),
            data.get('due-time').toString(),
        ].join(' ')), data.get('priority').toString(), data.get('description').toString(), curStage);
        Task.insert(newTask);
        TaskView.createView(newTask);
        return false;
    };
    return TaskController;
}());
/* manipulation */
/* main */
document.getElementById('new-task').onsubmit = TaskController.addTask;
var stages_div = document.getElementById('stages');
for (var index = 0; index <= Stage.Done; index++) {
    var stage_str = Stage[index];
    var anchor = document.createElement('button');
    anchor.id = ['stage-', stage_str.toLowerCase()].join('');
    anchor.textContent = stage_str;
    anchor.onclick = TaskView.changeViewToStage.bind(null, index);
    stages_div.appendChild(anchor);
}
Task.load();
TaskView.changeViewToStage(curStage);
